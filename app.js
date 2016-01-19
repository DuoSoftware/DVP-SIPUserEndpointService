/**
 * Created by pawan on 2/10/2015.
 */
// TODO :- URL fixing (ex:- by Company)
// in saving add pin to db :- done
// update pin also :- done
// update context of user
// on get context was not sent

// Transfer codes
//





var restify = require('restify');
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


var port = config.Host.port || 3000;
var version=config.Host.version;



var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
});

restify.CORS.ALLOW_HEADERS.push('authorization');
RestServer.use(restify.CORS());
RestServer.use(restify.fullResponse());

RestServer.listen(port, function () {
    console.log('%s listening at %s', RestServer.name, RestServer.url);
});

//Server listen

//Enable request body parsing(access)
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());
RestServer.use(cors());


RestServer.post('/DVP/API/:version/SipUser/DidNumber', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.NewDidNumber] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken) {
            reqBody.CompanyId = 1;
            reqBody.TenantId = 1;


            Extmgt.AddDidNumberDB(reqId, reqBody, function (err, addResult)
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

RestServer.post('/DVP/API/:version/SipUser/DidNumber/:didNum/AssignToExt/:ext', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        var didNum = req.params.didNum;
        var ext = req.params.ext;

        logger.debug('[DVP-SIPUserEndpointService.AssignDidNumToExt] - [%s] - HTTP Request Received - Req Params - didNum : %s, ext : %s', reqId, didNum, ext);

        if(securityToken)
        {
            Extmgt.AssignDidNumberToExtDB(reqId, didNum, ext, 1, 1, function (err, setResult)
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

RestServer.post('/DVP/API/:version/SipUser/EmergencyNumber', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.NewEmergencyNumber] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            reqBody.CompanyId = 1;
            reqBody.TenantId = 1;

            Extmgt.AddEmergencyNumberDB(reqId, reqBody, function (err, addResult)
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

RestServer.post('/DVP/API/:version/SipUser/DodNumber', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var extId = req.body.ExtId;
        var dodNumber = req.body.DodNumber;
        var isActive = req.body.DodActive;

        logger.debug('[DVP-SIPUserEndpointService.SetDodNumber] - [%s] - HTTP Request Received - Req Body : %s', reqId, req.body);

        if(securityToken)
        {
            Extmgt.SetDodNumberToExtDB(reqId, dodNumber, extId, 1, 1, isActive, function (err, updateRes) {
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

RestServer.post('/DVP/API/:version/SipUser/DidNumber/:didNum/Activate/:isActive', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var didNum = req.params.didNum;
        var isActive = req.params.isActive;

        logger.debug('[DVP-SIPUserEndpointService.SetDidNumberStatus] - [%s] - HTTP Request Received - Req Params : DidId : %s, isActive " %s', reqId, didNum, isActive);

        if(securityToken)
        {
            Extmgt.SetDidNumberActiveStatusDB(reqId, didNum, 1, 1, isActive, function (err, assignResult) {
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

RestServer.del('/DVP/API/:version/SipUser/DidNumber/:id', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var didId = req.params.id;

        logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumber] - [%s] - HTTP Request Received - Req Params - didId : %s', reqId, didId);

        if(securityToken)
        {

            Extmgt.DeleteDidNumberDB(reqId, didId, 1, 1, function (err, delResult)
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

RestServer.del('/DVP/API/:version/SipUser/EmergencyNumber/:emergencyNum', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var emergencyNum = req.params.emergencyNum;

        logger.debug('[DVP-SIPUserEndpointService.DeleteEmergencyNumber] - [%s] - HTTP Request Received - Req Params - emergencyNum : %s', reqId, emergencyNum);

        if(securityToken && emergencyNum)
        {

            Extmgt.DeleteEmergencyNumberDB(reqId, emergencyNum, 1, 1, function (err, delResult)
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

RestServer.get('/DVP/API/:version/SipUser/EmergencyNumbers', function(req, res, next) {
    var emptyArr = [];
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        logger.debug('[DVP-SIPUserEndpointService.EmergencyNumbers] - [%s] - HTTP Request Received', reqId);

        if(securityToken)
        {

            Extmgt.GetEmergencyNumbersForCompany(reqId, 1, 1, function (err, eNums)
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

RestServer.get('/DVP/API/:version/SipUser/DidNumbers', function(req, res, next) {
    var emptyArr = [];
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');

        logger.debug('[DVP-SIPUserEndpointService.DidNumbers] - [%s] - HTTP Request Received', reqId);

        if(securityToken)
        {

            Extmgt.GetDidNumbersForCompanyDB(reqId, 1, 1, function (err, didNums)
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

RestServer.post('/DVP/API/:version/SipUser/DuoWorldUser', function(req, res, next) {
    var reqId = uuid.v1();
    try
    {
        var securityToken = req.header('authorization');
        var reqBody = req.body;

        logger.debug('[DVP-SIPUserEndpointService.DuoWorldUser] - [%s] - HTTP Request Received - Req Body : ', reqId, reqBody);

        if(reqBody && securityToken)
        {
            reqBody.CompanyId = 1;
            reqBody.TenantId = 1;

            var tempUsername = reqBody.SipUsername;

            var c2cRegExPattern = new RegExp('@');

            if(tempUsername && !c2cRegExPattern.test(tempUsername))
            {
                PublicUser.UpdatePublicUser(reqId, reqBody, function (err, addResult)
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


//.......................................................................................................................


RestServer.post('/DVP/API/'+version+'/SipUser/Context',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId,JSON.stringify(req.body));

        context.AddOrUpdateContext(req.body,reqId, function (err, resz) {

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



RestServer.post('/DVP/API/'+version+'/SipUser/User',function(req,res,next) {
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

        SipbackendHandler.CreateUser(req,reqId,function (err,resz) {
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

RestServer.put('/DVP/API/'+version+'/SipUser/User/:Username',function(req,res,next) {
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

        SipbackendHandler.UpdateUser(req.params.Username,req.body,reqId,function (err, resz) {
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



// no swagger
RestServer.put('/DVP/API/'+version+'/SipUser/User/:Username/Status/:st',function(req,res,next) {
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

        SipbackendHandler.UpdateUserStatus(req.params.Username,req.params.st,reqId,function (err, resz) {
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
RestServer.get('/DVP/API/'+version+'/SipUser/Users',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var Company=1;
    var Tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [HTTP]  - Request received -  Data - Body %s ',reqId,JSON.stringify(req.body));

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

RestServer.get('/DVP/API/'+version+'/SipUser/User/:Username',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var Company=1;
    var Tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [HTTP]  - Request received -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body));

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

RestServer.get('/DVP/API/'+version+'/SipUser/User/ByUUID/:uuid',function(req,res,next) {
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

        SipbackendHandler.PickUserByUUID(reqId,sipUuid, 1, 1, function (err, sipUsr) {
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

RestServer.get('/DVP/API/'+version+'/SipUser/Extension/:extention',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var ext = req.params.extention;
    var Tenant=1;
    var Company=1;
    try
    {

        logger.debug('[DVP-SIPUserEndpointService.GetUsersOfExtension] - [%s] - [HTTP]  - Request received -  ext - %s ',reqId,ext);

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

RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:extension/Status/:st',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Tenant=1;
    var Company=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [HTTP]  - Request received -  Data - Tenant %s Id %s Status %s ',reqId,req.params.tenant,req.params.extension,req.params.st);

        Extmgt.ChangeUserAvailability(Tenant,req.params.extension,req.params.st,reqId,function (err, resz) {
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

RestServer.post('/DVP/API/'+version+'/SipUser/Extension',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

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
RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:Extension',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

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
RestServer.del('/DVP/API/'+version+'/SipUser/Extension/:Extension',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

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

RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:extension/AssignToSipUser/:id',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var Company=1;
    var Tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [HTTP]  - Request received -  Data - Ext %s UAC %s Data %s',reqId,req.params.extension,req.params.id,JSON.stringify(req.body));

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

RestServer.post('/DVP/API/'+version+'/SipUser/Extension/:extension/AssignToGroup/:grpid',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.AssignToGroup] - [%s] - [HTTP]  - Request received -  Extension %s Group %',reqId,req.params.extension,req.params.grpid);

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

RestServer.post('/DVP/API/'+version+'/SipUser/Group',function(req,res,next) {
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

        SipbackendHandler.CreateUserGroup(req.body,reqId, function (err, resz) {
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

RestServer.post('/DVP/API/'+version+'/SipUser/Group/:id',function(req,res,next) {
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

        SipbackendHandler.UpdateUserGroup(req.params.id,req.body,reqId,function (err, resz) {
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

RestServer.get('/DVP/API/'+version+'/SipUser/Context/ByCompany/:companyid',function(req,res,next){
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

        context.GetCompanyContextDetails(parseInt(req.params.companyid),reqId, function (err, resz) {
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

RestServer.get('/DVP/API/'+version+'/SipUser/Group/:id',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var Company=1;
    var Tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.id);

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

RestServer.get('/DVP/API/'+version+'/SipUser/Group/User/:sipid',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var Company=1;
    var Tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.sipid);

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

RestServer.get('/DVP/API/'+version+'/SipUser/Groups/Company/:companyid',function(req,res,next) {
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

        SipbackendHandler.PickCompayGroups(req.params.companyid,reqId, function (err, resz) {
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
//.......................................................................................................................

RestServer.get('/DVP/API/'+version+'/SipUser/Users/InGroup/:groupid',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.groupid);

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

RestServer.get('/DVP/API/'+version+'/SipUser/Users/OfCompany/:compid',function(req,res,next) {
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

        SipbackendHandler.PickCompanyUsers(req.params.compid,reqId,function (err, resz) {
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

RestServer.get('/DVP/API/'+version+'/SipUser/Extension/:extension/User',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Tenant=1;
    var Company=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.extension);

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
RestServer.get('/DVP/API/'+version+'/SipUser/Extensions/OfCompany/:companyid',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.companyid);

        Extmgt.PickCompanyExtensions(req.params.companyid,Tenant,reqId,function (err, resz) {
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

RestServer.post('/DVP/API/'+version+'/SipUser/:SipID/AssignToGroup/:grpid',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.AssignToGroup] - [%s] - [HTTP]  - Request received -  Extension %s Group %',reqId,req.params.extension,req.params.grpid);


        SipbackendHandler.AssignUserToGroup(req.params.SipID,req.params.grpid,reqId,function (err, resz) {
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

RestServer.post('/DVP/API/'+version+'/SipUser/PublicUser',function(req,res,next){

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

        PublicUser.AddPublicUser(req.body,reqId,function(err,resp)
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

RestServer.post('/DVP/API/'+version+'/SipUser/PublicUser/Activate',function(req,res,next) {

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
        PublicUser.ActivatePublicUser(req.body.SipUsername,req.body.Pin,reqId,function(err,resz)
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

RestServer.get('/DVP/API/'+version+'/SipUser/PublicUser/:User/Pin',function(req,res,next) {

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
        PublicUser.PinOfUser(req.params.User,reqId,function(err,resz)
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

RestServer.get('/DVP/API/'+version+'/SipUser/PublicUser/RegeneratePin',function(req,res,next) {

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
        PublicUser.ReGeneratePin(req.body.SipUsername,reqId,function(err,resz)
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

RestServer.post('/DVP/API/'+version+'/SipUser/Endpoint',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;


    try {
        if(req.header('authorization'))
        {
            var auth = req.header('authorization');
            var authInfo = auth.split("#");

            if (authInfo.length >= 2) {
                Tenant = authInfo[0];
                Company = authInfo[1];
            }
        }
        else
        {
            Tenant = 1;
            Company = 1;
        }

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.AddEndpoint] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }


    try
    {
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

RestServer.post('/DVP/API/'+version+'/SipUser/Endpoint/:user/Availability',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;


    try {
        if(req.header('authorization'))
        {
            var auth = req.header('authorization');
            var authInfo = auth.split("#");

            if (authInfo.length >= 2) {
                Tenant = authInfo[0];
                Company = authInfo[1];
            }
        }
        else
        {
            Tenant = 1;
            Company = 1;
        }

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.UpdateAvailability] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }


    try
    {
        EndPoint.EndpointAvailabilityUpdation(req.params.user,req.body.Phone,req.body.Availability,reqId,function(err,resz)
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

RestServer.del('/DVP/API/'+version+'/SipUser/Endpoint/:user',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;



    try {
        if(req.header('authorization'))
        {
            var auth = req.header('authorization');
            var authInfo = auth.split("#");

            if (authInfo.length >= 2) {
                Tenant = authInfo[0];
                Company = authInfo[1];
            }
        }
        else
        {
            Tenant = 1;
            Company = 1;
        }

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.RemoveEndPoint] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }


    try
    {
        EndPoint.RemoveEndpoint(req.params.user,req.body.Phone,reqId,function(err,resz)
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

RestServer.get('/DVP/API/'+version+'/SipUser/Endpoints/:user',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;



    try {
        if(req.header('authorization'))
        {
            var auth = req.header('authorization');
            var authInfo = auth.split("#");

            if (authInfo.length >= 2) {
                Tenant = authInfo[0];
                Company = authInfo[1];
            }
        }
        else
        {
            Tenant = 1;
            Company = 1;
        }

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.AllEndpoints] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }


    try
    {
        EndPoint.AllEndpointsOfuser(req.params.user,reqId,function(err,resz)
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

RestServer.get('/DVP/API/'+version+'/SipUser/Endpoint/:user/:phone',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;



    try {
        if(req.header('authorization'))
        {
            var auth = req.header('authorization');
            var authInfo = auth.split("#");

            if (authInfo.length >= 2) {
                Tenant = authInfo[0];
                Company = authInfo[1];
            }
        }
        else
        {
            Tenant = 1;
            Company = 1;
        }

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.AllEndpoints] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }


    try
    {
        EndPoint.GetEndpointDetails(req.params.user,req.params.phone,reqId,function(err,resz)
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

RestServer.post('/DVP/API/'+version+'/SipUser/TransferCodes',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;


    try {
        if(req.header('authorization'))
        {
            var auth = req.header('authorization');
            var authInfo = auth.split("#");

            if (authInfo.length >= 2) {
                Tenant = authInfo[0];
                Company = authInfo[1];
            }
        }
        else
        {
            Tenant = 1;
            Company = 1;
        }

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.SetTransferCode] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }


    try
    {
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

RestServer.put('/DVP/API/'+version+'/SipUser/TransferCodes',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Company=1;
    var Tenant=1;


    try {
        if(req.header('authorization'))
        {
            var auth = req.header('authorization');
            var authInfo = auth.split("#");

            if (authInfo.length >= 2) {
                Tenant = authInfo[0];
                Company = authInfo[1];
            }
        }
        else
        {
            Tenant = 1;
            Company = 1;
        }

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.UpdateTransferCodes] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }


    try
    {
        Extmgt.UpdateTransferCodes(Company,Tenant,req.body,reqId,function(err,resz)
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

// App designing phase

// no swagger
RestServer.get('/DVP/API/'+version+'/SipUser/Contexts',function(req,res,next) {

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var Company=1;
    var Tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - [HTTP]  - Request received ',reqId);

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

// no swagger
RestServer.post('/DVP/API/'+version+'/SipUser/Context/:context',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var company=1;
    var tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - [HTTP]  - Request received -  Context :%s Data - %s ',reqId,req.params.context,JSON.stringify(req.body));

        context.UpdateContext(company,tenant,req.params.context,req.body,reqId, function (err, resz) {

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
RestServer.get('/DVP/API/'+version+'/SipUser/Context/:context',function(req,res,next) {
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }
    var company=1;
    var tenant=1;


    try {

        logger.debug('[DVP-SIPUserEndpointService.PickContext] - [%s] - [HTTP]  - Request received -  Context :%s Data - %s ',reqId,req.params.context);

        context.PickContext(company,tenant,req.params.context,reqId, function (err, resz) {

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