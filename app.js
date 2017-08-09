var restify = require('restify');
var CryptoJS = require("crypto-js");
var crypto = require('crypto');
var context=require('./SipcontextManager.js');
var Extmgt=require('./ExtensionManagementAPI.js');
var PublicUser=require('./PublicUserService.js');
var EndPoint=require('./EndpointManagement.js');
var SipbackendHandler=require('./SipuserBackendHandler.js');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var uuid = require('node-uuid');
var cors = require('cors');
var jwt = require('restify-jwt');
var util = require('util');
var _ = require('lodash');
var secret = require('dvp-common/Authentication/Secret.js');
var authorization = require('dvp-common/Authentication/Authorization.js');


var port = config.Host.port || 3000;
var version=config.Host.version;



var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
});

restify.CORS.ALLOW_HEADERS.push('authorization');
RestServer.use(restify.CORS());
RestServer.use(restify.fullResponse());
RestServer.use(jwt({secret: secret.Secret}));
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());
RestServer.use(cors());

var mongoip=config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodb=config.Mongo.dbname;
var mongouser=config.Mongo.user;
var mongopass = config.Mongo.password;
var mongoreplicaset= config.Mongo.replicaset;

var mongoose = require('mongoose');
var connectionstring = '';
mongoip = mongoip.split(',');

if(util.isArray(mongoip)){
 if(mongoip.length > 1){    
    mongoip.forEach(function(item){
        connectionstring += util.format('%s:%d,',item,mongoport)
    });

    connectionstring = connectionstring.substring(0, connectionstring.length - 1);
    connectionstring = util.format('mongodb://%s:%s@%s/%s',mongouser,mongopass,connectionstring,mongodb);

    if(mongoreplicaset){
        connectionstring = util.format('%s?replicaSet=%s',connectionstring,mongoreplicaset) ;
    }
 }
    else
    {
         connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip[0],mongoport,mongodb);
    }
}else{

    connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodb);
}


console.log("ConnectionString ------------ "+connectionstring);

mongoose.connect(connectionstring,{server:{auto_reconnect:true}});


mongoose.connection.on('error', function (err) {
    console.error( new Error(err));
    mongoose.disconnect();

});

mongoose.connection.on('opening', function() {
    console.log("reconnecting... %d", mongoose.connection.readyState);
});


mongoose.connection.on('disconnected', function() {
    console.error( new Error('Could not connect to database'));
    mongoose.connect(connectionstring,{server:{auto_reconnect:true}});
});

mongoose.connection.once('open', function() {
    console.log("Connected to db");

});


mongoose.connection.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});



process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});




var encryptPass = config.Host.encryptionPassword;

function encryptTest(text)
{
    try{
        var key = '00000000000000000000000000000000'; //replace with your key
        var iv = '0000000000000000'; //replace with your IV

        var cipher = crypto.createCipheriv('aes256', key, iv);
        var crypted = cipher.update("DuoS123456789", 'utf8', 'base64');
        crypted += cipher.final('base64');
        console.log(crypted);


        var decipher = crypto.createDecipher('aes256', key,iv);
        var decrypted = decipher.update(crypted, 'utf8', 'base64');
        decrypted += decipher.final('base64');
        console.log(decrypted);

        return crypted;
    }
    catch (ex){
        console.log(ex)
    }



    /*var ciphertext = CryptoJS.AES.encrypt(text, encryptPass);
    return ciphertext.toString();*/
}



RestServer.post('/DVP/API/:version/SipUser/DidNumber', authorization({resource:"number", action:"write"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody!=null && securityToken)
        {
            var companyId = req.user.company;
            var tenantId = req.user.tenant;

            if (!companyId || !tenantId)
            {
                throw new Error("Invalid company or tenant");
            }

            Extmgt.AddDidNumberDB(reqId, reqBody, companyId, tenantId, function (err, addResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add NewDidNumber Failed", false, false);
                    logger.debug('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add NewDidNumber Success", true, addResult);
                    logger.debug('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.post('/DVP/API/:version/SipUser/DidNumber/:didNum/AssignToExt/:ext', authorization({resource:"number", action:"write"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        var didNum = req.params.didNum;
        var ext = req.params.ext;

        logger.debug('[DVP-SIPUserEndpointService.AssignDidNumToExt] - [%s] - HTTP Request Received - Req Params - didNum : %s, ext : %s', reqId, didNum, ext);

        if(securityToken)
        {
            var companyId = req.user.company;
            var tenantId = req.user.tenant;

            if (!companyId || !tenantId)
            {
                throw new Error("Invalid company or tenant");
            }

            Extmgt.AssignDidNumberToExtDB(reqId, didNum, ext, companyId, tenantId, function (err, setResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "AssignDidNumToExt Failed", false, false);
                    logger.debug('[DVP-SIPUserEndpointService.AssignDidNumToExt] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "AssignDidNumToExt Success", true, setResult);
                    logger.debug('[DVP-SIPUserEndpointService.AssignDidNumToExt] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('No authorization token set'), "No authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.AssignDidNumToExt] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AssignDidNumToExt] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.AssignDidNumToExt] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.post('/DVP/API/:version/SipUser/EmergencyNumber', authorization({resource:"sipuser", action:"write"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.NewEmergencyNumber] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            var companyId = req.user.company;
            var tenantId = req.user.tenant;

            if (!companyId || !tenantId)
            {
                throw new Error("Invalid company or tenant");
            }

            Extmgt.AddEmergencyNumberDB(reqId, reqBody, companyId, tenantId, function (err, addResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add NewEmergencyNumber Failed", false, -1);
                    logger.debug('[DVP-SIPUserEndpointService.NewEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Add NewEmergencyNumber Success", true, addResult);
                    logger.debug('[DVP-SIPUserEndpointService.NewEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, -1);
            logger.debug('[DVP-SIPUserEndpointService.NewEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.NewEmergencyNumber] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, -1);
        logger.debug('[DVP-SIPUserEndpointService.NewEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.post('/DVP/API/:version/SipUser/DodNumber', authorization({resource:"sipuser", action:"write"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var extId = req.body.ExtId;
        var dodNumber = req.body.DodNumber;
        var isActive = req.body.DodActive;

        logger.debug('[DVP-SIPUserEndpointService.SetDodNumber] - [%s] - HTTP Request Received - Req Body : %s', reqId, req.body);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(securityToken)
        {
            Extmgt.SetDodNumberToExtDB(reqId, dodNumber, extId, companyId, tenantId, isActive, function (err, updateRes) {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Set Dod number Failed", false, false);
                    logger.debug('[DVP-SIPUserEndpointService.SetDodNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Set Dod Number Success", true, updateRes);
                    logger.debug('[DVP-SIPUserEndpointService.SetDodNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.post('/DVP/API/:version/SipUser/DidNumber/:didNum/Activate/:isActive', authorization({resource:"number", action:"write"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var didNum = req.params.didNum;
        var isActive = req.params.isActive;

        logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - HTTP Request Received - Req Params : DidId : %s, isActive " %s', reqId, didNum, isActive);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(securityToken)
        {
            Extmgt.SetDidNumberActiveStatusDB(reqId, didNum, companyId, tenantId, isActive, function (err, assignResult) {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Set Did Number Status Failed", false, false);
                    logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Set Did Number Status Success", true, assignResult);
                    logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })
        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.del('/DVP/API/:version/SipUser/DidNumber/:id', authorization({resource:"number", action:"delete"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var didId = req.params.id;

        logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumber] - [%s] - HTTP Request Received - Req Params - didId : %s', reqId, didId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(securityToken)
        {

            Extmgt.DeleteDidNumberDB(reqId, didId, companyId, tenantId, function (err, delResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete DID Record Failed", false, false);
                    logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete DID Record Success", true, delResult);
                    logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteDidNumber] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.del('/DVP/API/:version/SipUser/EmergencyNumber/:emergencyNum', authorization({resource:"sipuser", action:"delete"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var emergencyNum = req.params.emergencyNum;

        logger.debug('[DVP-SIPUserEndpointService.DeleteEmergencyNumber] - [%s] - HTTP Request Received - Req Params - emergencyNum : %s', reqId, emergencyNum);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(securityToken && emergencyNum)
        {

            Extmgt.DeleteEmergencyNumberDB(reqId, emergencyNum, companyId, tenantId, function (err, delResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete emergency number Record Failed", false, false);
                    logger.debug('[DVP-SIPUserEndpointService.DeleteEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete emergency number Record Success", true, delResult);
                    logger.debug('[DVP-SIPUserEndpointService.DeleteEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.DeleteEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteEmergencyNumber] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.DeleteEmergencyNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.get('/DVP/API/:version/SipUser/EmergencyNumbers', authorization({resource:"sipuser", action:"read"}), function(req, res, next) {
    var emptyArr = [];
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        logger.debug('[DVP-SIPUserEndpointService.EmergencyNumbers] - [%s] - HTTP Request Received', reqId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(securityToken)
        {

            Extmgt.GetEmergencyNumbersForCompany(reqId, companyId, tenantId, function (err, eNums)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get Emergency Numbers for company Failed", false, eNums);
                    logger.debug('[DVP-SIPUserEndpointService.EmergencyNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get Emergency Numbers for company Success", true, eNums);
                    logger.debug('[DVP-SIPUserEndpointService.EmergencyNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, emptyArr);
            logger.debug('[DVP-SIPUserEndpointService.EmergencyNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.EmergencyNumbers] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-SIPUserEndpointService.EmergencyNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.get('/DVP/API/:version/SipUser/DidNumbers', authorization({resource:"number", action:"read"}), function(req, res, next) {
    var emptyArr = [];
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        logger.debug('[DVP-SIPUserEndpointService.DidNumbers] - [%s] - HTTP Request Received', reqId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(securityToken)
        {

            Extmgt.GetDidNumbersForCompanyDB(reqId, companyId, tenantId, function (err, didNums)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get did numbers for company Failed", false, didNums);
                    logger.debug('[DVP-SIPUserEndpointService.DidNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Get did numbers for company Success", true, didNums);
                    logger.debug('[DVP-SIPUserEndpointService.DidNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request params or no authorization token set", false, emptyArr);
            logger.debug('[DVP-SIPUserEndpointService.DidNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DidNumbers] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-SIPUserEndpointService.DidNumbers] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.post('/DVP/API/:version/SipUser/DuoWorldUser', authorization({resource:"sipuser", action:"write"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.DuoWorldUser] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(reqBody && securityToken)
        {
            var tempUsername = reqBody.SipUsername;

            var c2cRegExPattern = new RegExp('@');

            if(tempUsername && !c2cRegExPattern.test(tempUsername))
            {
                PublicUser.UpdatePublicUser(reqId, reqBody, companyId, tenantId, function (err, addResult)
                {
                    if (err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Add NewDidNumber Failed", false, false);
                        logger.debug('[DVP-SIPUserEndpointService.DuoWorldUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Add DuoWorldUser Success", true, addResult);
                        logger.debug('[DVP-SIPUserEndpointService.DuoWorldUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }

                })
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(new Error('Username empty or contains @ sign'), "Username empty or contains @ sign", false, false);
                logger.debug('[DVP-SIPUserEndpointService.DuoWorldUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.DuoWorldUser] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DuoWorldUser] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.put('/DVP/API/:version/SipUser/Extension/:extension/RecordingStatus/:status', authorization({resource:"extension", action:"write"}), function(req, res, next) {

    var reqId = uuid.v1();
    try
    {
        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        var extension = req.params.extension;
        var status = req.params.status;

        logger.debug('[DVP-SIPUserEndpointService.SetRecordingStatus] - [%s] - HTTP Request Received - PARAMS - Extension : %s, RecordongStatus : %s', reqId, extension, status);

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        Extmgt.SetRecordingStatus(reqId, status, extension, companyId, tenantId, function (err, resp)
        {
            if (err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Set recording status failed", false, false);
                logger.debug('[DVP-SIPUserEndpointService.SetRecordingStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(err, "Set recording status success", true, resp);
                logger.debug('[DVP-SIPUserEndpointService.SetRecordingStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }

        })

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.SetRecordingStatus] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-SIPUserEndpointService.SetRecordingStatus] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

//.......................................................................................................................




RestServer.post('/DVP/API/'+version+'/SipUser/User',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {


        logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.CreateUser(req,Company,Tenant,reqId,function (err,resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [HTTP]  - Exception in Request receiving  -  Data - %s ',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();
});

RestServer.get('/DVP/API/'+version+'/SipUser/EnableCount',authorization({resource:"sipuser", action:"read"}),function(req,res,next)
{
    var reqId = uuid.v1();
    try
    {
        logger.debug('[DVP-SIPUserEndpointService.SipUserEnableCount] - [%s] - HTTP Request Received', reqId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        SipbackendHandler.GetEnabledSipUserCount(companyId, tenantId)
            .then(function(count)
            {
                var jsonString = messageFormatter.FormatMessage(null, "Get sip user count successful", true, count);
                logger.debug('[DVP-SIPUserEndpointService.SipUserEnableCount] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            }).catch(function(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Error occurred", false, 0);
                logger.debug('[DVP-SIPUserEndpointService.SipUserEnableCount] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            });


    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Error occurred", false, null);
        logger.debug('[DVP-SIPUserEndpointService.SipUserEnableCount] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.put('/DVP/API/'+version+'/SipUser/User/:Username',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [HTTP]  - Request received -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.UpdateUser(req.params.Username,req.body,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [HTTP]  - Exception in Request -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.del('/DVP/API/'+version+'/SipUser/User/:Username',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try {

        logger.debug('[DVP-SIPUserEndpointService.DeleteUser] - [%s] - [HTTP]  - Request received -  Data - Username %s Status %s ',reqId,req.params.Username,req.params.st);

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        SipbackendHandler.UpdateUserStatus(req.params.Username,false,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.DeleteUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.DeleteUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteUser] - [%s] - [HTTP]  - Exception in Request -  Data - Username %s Status %s ',reqId,req.params.Username,req.params.st,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.DeleteUser] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

// no swagger
RestServer.put('/DVP/API/'+version+'/SipUser/User/:Username/Status/:st',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - [HTTP]  - Request received -  Data - Username %s Status %s ',reqId,req.params.Username,req.params.st);

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        SipbackendHandler.UpdateUserStatus(req.params.Username,req.params.st,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - [HTTP]  - Exception in Request -  Data - Username %s Status %s ',reqId,req.params.Username,req.params.st,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

//no swagger
RestServer.get('/DVP/API/'+version+'/SipUser/Users',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [HTTP]  - Request received -  Data - Body %s ',reqId,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.PickAllUsers(Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [HTTP]  - Exception in Request -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.get('/DVP/API/'+version+'/SipUser/User/:Username',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [HTTP]  - Request received -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        SipbackendHandler.PickUserByName(req.params.Username,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [HTTP]  - Exception in Request -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.get('/DVP/API/'+version+'/SipUser/User/:username/Password',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {

    var reqId = uuid.v1();
    try
    {
        logger.debug('[DVP-SIPUserEndpointService.RetrievePassword] - [%s] - HTTP Request Received', reqId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;
        var username = req.params.username;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        var key = 'DuoS1230000000000000000000000000'; //replace with your key
        var iv = '0000000000000000'; //replace with your IV

        var encryptPass = config.Host.encryptionPassword;

        function encrypt(text)
        {
            var ciphertext = CryptoJS.AES.encrypt(text, encryptPass);
            return ciphertext.toString();
        }

        function encryptiv(key, data) {
            var cipher = crypto.createCipheriv('aes256', key, iv);
            var crypted = cipher.update(data, 'utf8', 'base64');
            crypted += cipher.final('base64');
            return crypted;
        }

        function decryptiv(key, data) {
            var decipher = crypto.createDecipheriv('aes256', key,iv);
            var decrypted = decipher.update(data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        }

        SipbackendHandler.GetUserByUsername(reqId, username, companyId, tenantId, function (err, result)
        {
            if (err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Get password for user failed", false, null);
                logger.debug('[DVP-SIPUserEndpointService.RetrievePassword] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var encryptedPass = null;
                if(result)
                {

                    if(req.params.iv || req.params.iv==="") {

                        var encryptedPass = encryptiv(key, result.Password);
                        console.log("Encrypted Text: " + encryptedPass);
                        /*var decryptedText = decrypt(key, encryptedText);
                         console.log("Decrypted Text: " + decryptedText);*/
                    }
                    else {
                        encryptedPass = encrypt(result.Password);
                    }
                }
                var jsonString = messageFormatter.FormatMessage(null, "Operation success", true, encryptedPass);
                logger.debug('[DVP-SIPUserEndpointService.RetrievePassword] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            }

        })

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, null);
        logger.debug('[DVP-SIPUserEndpointService.RetrievePassword] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.get('/DVP/API/'+version+'/SipUser/User/ByUUID/:uuid',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var sipUuid = req.params.uuid;

    try
    {

        logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [HTTP]  - Request received -  Uuid - %s ',reqId,sipUuid);

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.PickUserByUUID(reqId,sipUuid, Company, Tenant, function (err, sipUsr) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, sipUsr);
                logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [HTTP]  - Exception in Request',reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - Request response : %s ',reqId, jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.get('/DVP/API/'+version+'/SipUser/Extension/:extention',authorization({resource:"extension", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var ext = req.params.extention;

    try
    {

        logger.debug('[DVP-SIPUserEndpointService.GetUsersOfExtension] - [%s] - [HTTP]  - Request received -  ext - %s ',reqId,ext);

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.GetUsersOfExtension(reqId,ext, Tenant,Company, function (err, extInfo) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.GetUsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, extInfo);
                logger.debug('[DVP-SIPUserEndpointService.GetUsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.GetUsersOfExtension] - [%s] - [HTTP]  - Exception in Request',reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.GetUsersOfExtension] - [%s] - Request response : %s ',reqId, jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:extension/Status/:st',authorization({resource:"extension", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [HTTP]  - Request received -  Data - Extenstion %s Status %s ',reqId,req.params.extension,req.params.st);

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        Extmgt.ChangeUserAvailability(req.params.extension,req.params.st,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }


        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [HTTP]  - Exception in Request -  Data - Tenant %s Id %s Status %s ',reqId,req.params.tenant,req.params.id,req.params.st);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();
});

RestServer.post('/DVP/API/'+version+'/SipUser/Extension',authorization({resource:"extension", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;


        Extmgt.CreateExtension(req.body,Company,Tenant,reqId,function (errExt, resExt) {
            if(errExt)
            {
                var jsonString = messageFormatter.FormatMessage(errExt, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resExt);
                logger.debug('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }


        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});
//no swagger
RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:Extension',authorization({resource:"extension", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.UpdateExtension(req.params.Extension,req.body,Company,Tenant,reqId,function (errExt, resExt) {
            if(errExt)
            {
                var jsonString = messageFormatter.FormatMessage(errExt, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resExt);
                logger.debug('[DVP-SIPUserEndpointService.UpdateExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }


        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateExtension] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateExtension] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});
//no swagger
RestServer.del('/DVP/API/'+version+'/SipUser/Extension/:Extension',authorization({resource:"extension", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.DeleteExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId);

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.DeleteExtension(req.params.Extension,Company,Tenant,reqId,function (errExt, resExt) {
            if(errExt)
            {
                var jsonString = messageFormatter.FormatMessage(errExt, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.DeleteExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resExt);
                logger.debug('[DVP-SIPUserEndpointService.DeleteExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }


        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteExtension] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.DeleteExtension] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:extension/AssignToSipUser/:id',authorization({resource:"extension", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try {

        logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [HTTP]  - Request received -  Data - Ext %s UAC %s Data %s',reqId,req.params.extension,req.params.id,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.AssignToSipUser(req.params.extension,req.params.id,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [HTTP]  - Exception in Request  -  Ext %s UAC %s Data %s',reqId,req.params.extension,req.params.id,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:extension/AssignToGroup/:grpid',authorization({resource:"extension", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.AssignToGroup] - [%s] - [HTTP]  - Request received -  Extension %s Group %',reqId,req.params.extension,req.params.grpid);

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.AssignToGroup(req.params.extension,req.params.grpid,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [HTTP]  - Exception in Request -  Extension %s Group % Other %s',reqId,req.params.extension,req.params.grpid,JSON.stringify(req),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.post('/DVP/API/'+version+'/SipUser/Group',authorization({resource:"group", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.CreateUserGroup(req.body,Company,Tenant,reqId, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.del('/DVP/API/'+version+'/SipUser/Group/:id', authorization({resource:"group", action:"delete"}), function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var grpId = req.params.id;

        logger.debug('[DVP-SIPUserEndpointService.DeleteGroup] - [%s] - HTTP Request Received - Req Params - grpId : %s', reqId, grpId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(securityToken)
        {

            SipbackendHandler.DeleteGroupDB(reqId, grpId, companyId, tenantId, function (err, delResult)
            {
                if (err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete Group Record Failed", false, false);
                    logger.debug('[DVP-SIPUserEndpointService.DeleteGroup] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Delete Group Record Success", true, delResult);
                    logger.debug('[DVP-SIPUserEndpointService.DeleteGroup] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            })

        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request params or no authorization token set'), "Empty request body or no authorization token set", false, false);
            logger.debug('[DVP-SIPUserEndpointService.DeleteGroup] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteGroup] - [%s] - Exception Occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-SIPUserEndpointService.DeleteGroup] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.put('/DVP/API/'+version+'/SipUser/Group/:id',authorization({resource:"group", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [HTTP]  - Request received -  Data - ID %s Other %s',reqId,req.params.id,JSON.stringify(req.body));
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.UpdateUserGroup(req.params.id,req.body,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [HTTP]  - Exception in Request  - Data - ID %s Other %s',reqId,req.params.id,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.get('/DVP/API/'+version+'/SipUser/Group/:id',authorization({resource:"group", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.id);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;
        SipbackendHandler.PickUserGroup(req.params.id,Company,Tenant,reqId, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,req.params.id);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});



//.......................................................................................................................

RestServer.get('/DVP/API/'+version+'/SipUser/Group/User/:sipid',authorization({resource:"group", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.sipid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;
        SipbackendHandler.PickUsersGroup(req.params.sipid,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [HTTP]  - Exception in Request - Data %s',reqId,req.params.sipid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false,undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();
});

RestServer.get('/DVP/API/'+version+'/SipUser/Groups',authorization({resource:"group", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.companyid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.PickCompayGroups(Company,Tenant,reqId, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [HTTP]  - Exception Request -  Data - %s',reqId,req.params.companyid);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.get('/DVP/API/'+version+'/SipUser/Context',authorization({resource:"context", action:"read"}),function(req,res,next){
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.companyid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        context.GetCompanyContextDetails(Company,Tenant,reqId, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, resz);
                logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,req.params.companyid);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    next();


});
//.......................................................................................................................

RestServer.get('/DVP/API/'+version+'/SipUser/Users/InGroup/:groupid',authorization({resource:"group", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.groupid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;
        SipbackendHandler.PickUsersInGroup(req.params.groupid,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.groupid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.get('/DVP/API/'+version+'/SipUser/Users/OfCompany/:compid',authorization({resource:"group", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.compid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;
        SipbackendHandler.PickCompanyUsers(Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.compid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    next();


});

RestServer.get('/DVP/API/'+version+'/SipUser/Extension/:extension/User',authorization({resource:"group", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.extension);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.PickExtensionUser(req.params.extension,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.extension,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});


// access taken company id problem
RestServer.get('/DVP/API/'+version+'/SipUser/Extensions',authorization({resource:"extension", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.companyid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.PickCompanyExtensions(Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.companyid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});


RestServer.get('/DVP/API/'+version+'/SipUser/ExtensionsByCategory/:category',authorization({resource:"extension", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.companyid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;
        Extmgt.PickCompanyExtensionsByCategory(Company,Tenant,req.params.category,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.companyid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});


RestServer.post('/DVP/API/'+version+'/SipUser/:SipID/AssignToGroup/:grpid',authorization({resource:"group", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.AssignToGroup] - [%s] - [HTTP]  - Request received -  Extension %s Group %',reqId,req.params.extension,req.params.grpid);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.AssignUserToGroup(req.params.SipID,req.params.grpid,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [HTTP]  - Exception in Request -  User %s Group % Other %s',reqId,req.params.SipID,req.params.grpid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.post('/DVP/API/'+version+'/SipUser/:SipID/RemoveFromGroup/:grpid',authorization({resource:"group", action:"delete"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {

        logger.debug('[DVP-SIPUserEndpointService.RemoveFromGroup] - [%s] - [HTTP]  - Request received', reqId);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        SipbackendHandler.UnAssignUserFromGroup(req.params.SipID,req.params.grpid,Company,Tenant,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.Extension.RemoveFromGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.Extension.RemoveFromGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.Extension.RemoveFromGroup] - [%s] - [HTTP]  - Exception in Request -  User %s Group % Other %s',reqId,req.params.SipID,req.params.grpid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.Extension.RemoveFromGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.post('/DVP/API/'+version+'/SipUser/PublicUser',authorization({resource:"sipuser", action:"write"}),function(req,res,next){

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        logger.debug('[DVP-SIPUserEndpointService.PublicUser] - [%s] - [HTTP]  - Request received  ');

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        PublicUser.AddPublicUser(req.body,Company,Tenant,reqId,function(err,resp)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PublicUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resp);
                logger.debug('[DVP-SIPUserEndpointService.PublicUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }


        });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PublicUser] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PublicUser] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }


    next();
});

RestServer.post('/DVP/API/'+version+'/SipUser/PublicUser/Activate',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        PublicUser.ActivatePublicUser(req.body.SipUsername,req.body.Pin,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.ActivatePublicUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.ActivatePublicUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.ActivatePublicUser] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.ActivatePublicUser] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

RestServer.get('/DVP/API/'+version+'/SipUser/PublicUser/:User/Pin',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        PublicUser.PinOfUser(req.params.User,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.PinOfUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.PinOfUser] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PinOfUser] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PinOfUser] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

RestServer.get('/DVP/API/'+version+'/SipUser/PublicUser/RegeneratePin',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        PublicUser.ReGeneratePin(req.body.SipUsername,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.RegeneratePin] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.RegeneratePin] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.RegeneratePin] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.RegeneratePin] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

RestServer.post('/DVP/API/'+version+'/SipUser/Endpoint',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try
    {

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        EndPoint.AddEndPoint(req.body,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.AddEndpoint] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.AddEndpoint] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AddEndpoint] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.AddEndpoint] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

RestServer.post('/DVP/API/'+version+'/SipUser/Endpoint/:user/Availability',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        EndPoint.EndpointAvailabilityUpdation(req.params.user,req.body.Phone,req.body.Availability,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateAvailability] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateAvailability] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateAvailability] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateAvailability] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

RestServer.del('/DVP/API/'+version+'/SipUser/Endpoint/:user',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        EndPoint.RemoveEndpoint(req.params.user,req.body.Phone,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.RemoveEndPoint] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.RemoveEndPoint] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.RemoveEndPoint] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.RemoveEndPoint] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

RestServer.get('/DVP/API/'+version+'/SipUser/Endpoints/:user',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }




    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        EndPoint.AllEndpointsOfuser(req.params.user,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.AllEndpoints] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.AllEndpoints] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AllEndpoints] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.AllEndpoints] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

RestServer.get('/DVP/API/'+version+'/SipUser/Endpoint/:user/:phone',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        EndPoint.GetEndpointDetails(req.params.user,req.params.phone,Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.GetEndpoint] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.GetEndpoint] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.GetEndpoint] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.GetEndpoint] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});


// Sprint 5 : Pawan

//no swagger
RestServer.post('/DVP/API/'+version+'/SipUser/TransferCode',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.AddTransferCodes(Company,Tenant,req.body,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.SetTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.SetTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.SetTransferCode] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.SetTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});
//no swagger
RestServer.put('/DVP/API/'+version+'/SipUser/TransferCode/:id',authorization({resource:"sipuser", action:"write"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.UpdateTransferCodes(Company,Tenant,req.params.id,req.body,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateTransferCodes] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.SetTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateTransferCodes] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateTransferCodes] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

//App design phase

// no swagger
RestServer.get('/DVP/API/'+version+'/SipUser/TransferCode',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.GetTransferCode(Company,Tenant,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.GetTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.GetTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.GetTransferCode] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.GetTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

// no swagger
RestServer.del('/DVP/API/'+version+'/SipUser/TransferCode/:id',authorization({resource:"sipuser", action:"read"}),function(req,res,next) {

    var reqId='';


    try
    {
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        Extmgt.RemoveTransferCode(Company,Tenant,req.params.id,reqId,function(err,resz)
        {
            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.RemoveTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.RemoveTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.RemoveTransferCode] - [%s] - [HTTP]  - Exception in Request ',ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.RemoveTransferCode] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }

    next();
});

// App designing phase

// no swagger
RestServer.get('/DVP/API/'+version+'/SipUser/Contexts',authorization({resource:"context", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try {

        logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - [HTTP]  - Request received ',reqId);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        context.PickAllContexts(Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - [HTTP]  - Exception in Request ',reqId,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

RestServer.get('/DVP/API/'+version+'/SipUser/Contexts/ClientCompany/:companyId',authorization({resource:"tenant", action:"read"}),function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try {

        logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - [HTTP]  - Request received ',reqId);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        context.PickAllContexts(req.params.companyId,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - [HTTP]  - Exception in Request ',reqId,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

// no swagger
RestServer.put('/DVP/API/'+version+'/SipUser/Context/:context',authorization({resource:"context", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - [HTTP]  - Request received -  Context :%s Data - %s ',reqId,req.params.context,JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        context.UpdateContext(Company,Tenant,req.params.context,req.body,reqId, function (err, resz) {

            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - [HTTP]  - Exception on Request received - Context :%s Data - %s ',reqId,req.params.context,JSON.stringify(req.body));
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});
// no swagger
RestServer.get('/DVP/API/'+version+'/SipUser/Context/:context',authorization({resource:"context", action:"read"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try {

        logger.debug('[DVP-SIPUserEndpointService.PickContext] - [%s] - [HTTP]  - Request received -  Context :%s Data - %s ',reqId,req.params.context);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;
        context.PickContext(Company,Tenant,req.params.context,reqId, function (err, resz) {

            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.PickContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.PickContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickContext] - [%s] - [HTTP]  - Exception on Request received - Context :%s ',reqId,req.params.context);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.PickContext] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

// update swagger
RestServer.post('/DVP/API/'+version+'/SipUser/ContextCodecPreferences/ClientCompany/:companyId',authorization({resource:"tenant", action:"write"}),function(req,res,next)
{
    var reqId = uuid.v1();
    try
    {
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody)
        {
            var companyId = req.user.company;
            var tenantId = req.user.tenant;

            if (!companyId || !tenantId)
            {
                throw new Error("Invalid company or tenant");
            }

            var tempArr = [];

            if(reqBody.Context1 && reqBody.Context2 && reqBody.Codecs && Array.isArray(reqBody.Codecs))
            {
                tempArr.push(reqBody.Context1, reqBody.Context2);

                var sortedArr = tempArr.sort();

                context.AddContextCodecPrefs(reqId, sortedArr[0], sortedArr[1], reqBody.Codecs, req.params.companyId, tenantId)
                    .then(function(saveResp)
                    {
                        var jsonString = messageFormatter.FormatMessage(null, "Add context preferences successful", true, saveResp);
                        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);

                    }).catch(function(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Error occurred", false, null);
                        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);

                    });
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(new Error('Context or codecs not provided'), "Error occurred", false, null);
                logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }



        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body'), "Empty request body", false, null);
            logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Error occurred", false, null);
        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.put('/DVP/API/'+version+'/SipUser/ContextCodecPreferences/Context1/:context1/Context2/:context2/ClientCompany/:companyId',authorization({resource:"tenant", action:"write"}),function(req,res,next)
{
    var reqId = uuid.v1();
    try
    {
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody)
        {
            var companyId = req.user.company;
            var tenantId = req.user.tenant;

            if (!companyId || !tenantId)
            {
                throw new Error("Invalid company or tenant");
            }

            var tempArr = [];

            if(req.params.context1 && req.params.context2 && reqBody.Codecs && Array.isArray(reqBody.Codecs))
            {
                tempArr.push(reqBody.Context1, reqBody.Context2);

                var sortedArr = tempArr.sort();

                context.UpdateContextCodecPrefs(reqId, sortedArr[0], sortedArr[1], reqBody.Codecs, req.params.companyId, tenantId)
                    .then(function(updateResp)
                    {
                        var jsonString = messageFormatter.FormatMessage(null, "Update context preferences successful", true, updateResp);
                        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);

                    }).catch(function(err)
                    {
                        var jsonString = messageFormatter.FormatMessage(err, "Error occurred", false, null);
                        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);

                    });
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(new Error('Context or codecs not provided'), "Error occurred", false, null);
                logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }



        }
        else
        {
            var jsonString = messageFormatter.FormatMessage(new Error('Empty request body'), "Empty request body", false, null);
            logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Error occurred", false, null);
        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.del('/DVP/API/'+version+'/SipUser/ContextCodecPreferences/:id/ClientCompany/:companyId',authorization({resource:"tenant", action:"delete"}),function(req,res,next)
{
    var reqId = uuid.v1();
    try
    {
        var recId = req.params.id;
        var clientCompany = req.params.companyId;

        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferencesDelete] - [%s] - HTTP Request Received', reqId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        context.RemoveContextCodecPrefs(reqId, recId, clientCompany, tenantId)
            .then(function(delResponse)
            {
                var jsonString = messageFormatter.FormatMessage(null, "Delete context preferences successful", true, delResponse);
                logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferencesDelete] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            }).catch(function(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Error occurred", false, null);
                logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferencesDelete] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            });


    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Error occurred", false, null);
        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferencesDelete] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.get('/DVP/API/'+version+'/SipUser/ContextCodecPreferences/ClientCompany/:companyId',authorization({resource:"tenant", action:"read"}),function(req,res,next)
{
    var reqId = uuid.v1();
    try
    {
        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferencesDelete] - [%s] - HTTP Request Received', reqId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        var clientComp = req.params.companyId;

        context.GetContextCodecPrefs(reqId, clientComp, tenantId)
            .then(function(codecPrefs)
            {
                var jsonString = messageFormatter.FormatMessage(null, "Get context preferences successful", true, codecPrefs);
                logger.debug('[DVP-SIPUserEndpointService.GetContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            }).catch(function(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Error occurred", false, null);
                logger.debug('[DVP-SIPUserEndpointService.GetContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            });


    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Error occurred", false, null);
        logger.debug('[DVP-SIPUserEndpointService.GetContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.get('/DVP/API/'+version+'/SipUser/ContextCodecPreferences/ContextIn/:contextIn/Extension/:ext/ClientCompany/:companyId',authorization({resource:"tenant", action:"read"}),function(req,res,next)
{
    var reqId = uuid.v1();
    try
    {
        logger.debug('[DVP-SIPUserEndpointService.ContextCodecPreferencesDelete] - [%s] - HTTP Request Received', reqId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        var clientCompany = req.params.companyId;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        context.GetContextCodecPrefsByContext(reqId, req.params.contextIn, req.params.ext, clientCompany, tenantId)
            .then(function(codecPrefs)
            {
                var jsonString = messageFormatter.FormatMessage(null, "Get context preferences successful", true, codecPrefs);
                logger.debug('[DVP-SIPUserEndpointService.GetContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            }).catch(function(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Error occurred", false, null);
                logger.debug('[DVP-SIPUserEndpointService.GetContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);

            });


    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Error occurred", false, null);
        logger.debug('[DVP-SIPUserEndpointService.GetContextCodecPreferences] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);

    }
    return next();

});

RestServer.post('/DVP/API/'+version+'/SipUser/Context',authorization({resource:"context", action:"write"}),function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }


    try
    {

        logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId, JSON.stringify(req.body));

        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        if(req.body.ClientCompany)
        {
            Company=req.body.ClientCompany;
        }

        if(req.body.ClientTenant)
        {
            Tenant=req.body.ClientTenant;
        }


        context.AddOrUpdateContext(Company,Tenant,req.body,reqId, function (err, resz) {

            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [HTTP]  - Exception on Request received -  Data - %s ',reqId,JSON.stringify(req.body));
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

// no swagger
RestServer.del('/DVP/API/'+version+'/SipUser/Context/:context',authorization({resource:"context", action:"write"}),function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    try {

        logger.debug('[DVP-SIPUserEndpointService.DeleteContext] - [%s] - [HTTP]  - Request received -  Context :%s Data - %s ',reqId,req.params.context);
        if (!req.user.company || !req.user.tenant)
        {
            throw new Error("Invalid company or tenant");
        }

        var Company=req.user.company;
        var Tenant=req.user.tenant;

        context.DeleteContext(Company,Tenant,req.params.context,reqId, function (err, resz) {

            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.DeleteContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.DeleteContext] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteContext] - [%s] - [HTTP]  - Exception on Request received - Context :%s ',reqId,req.params.context);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.DeleteContext] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

function Crossdomain(req,res,next){


    var xml='<?xml version=""1.0""?><!DOCTYPE cross-domain-policy SYSTEM ""http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd""> <cross-domain-policy>    <allow-access-from domain=""*"" />        </cross-domain-policy>';

    /*var xml='<?xml version="1.0"?>\n';

     xml+= '<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">\n';
     xml+='';
     xml+=' \n';
     xml+='\n';
     xml+='';*/
    req.setEncoding('utf8');
    res.end(xml);

}

function Clientaccesspolicy(req,res,next){


    var xml='<?xml version="1.0" encoding="utf-8" ?>       <access-policy>        <cross-domain-access>        <policy>        <allow-from http-request-headers="*">        <domain uri="*"/>        </allow-from>        <grant-to>        <resource include-subpaths="true" path="/"/>        </grant-to>        </policy>        </cross-domain-access>        </access-policy>';
    req.setEncoding('utf8');
    res.end(xml);

}

RestServer.get("/crossdomain.xml",Crossdomain);
RestServer.get("/clientaccesspolicy.xml",Clientaccesspolicy);

RestServer.listen(port, function () {
    console.log('%s listening at %s', RestServer.name, RestServer.url);
});
