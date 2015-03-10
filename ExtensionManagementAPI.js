/**
 * Created by pawan on 2/6/2015.
 */

var DbConn = require('./DVP-DBModels');
var DbSave=require('./SaveSipUserData.js');
var restify = require('restify');
var winston=require('winston');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

/*

 // Create Restify Server
 var RestServer = restify.createServer({
 name: "myapp",
 version: '1.0.0'
 },function(req,res)
 {

 });
 //Server listen
 RestServer.listen(8080, function () {
 console.log('%s listening at %s', RestServer.name, RestServer.url);
 });

 */




var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './ExtMgtLog.log' })

    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './ExtMgtLogErr.log' })
    ]

});







//post:-done
function ChangeAvailability(reqz,resz,errz) {
    logger.info('Start of Extension availability changing ');
    var status = 0;
    try {
        DbConn.Extension.find({where: {ExtRefId: reqz.params.ref}}).complete(function (err, ExtObject) {
            logger.info('Requested RefID: ' + reqz.params.ref);
            // console.log(ExtObject);
            if (ExtObject.length==0) {
                console.log("No record found for the RefId : " + reqz.params.ref);
                logger.info('No record for  RefID: ' + reqz.params.ref);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                resz.end(jsonString);
            }

            else if (!err && ExtObject.length>0) {
                logger.info('Updating Availability , RefID :' + reqz.params.ref);

                try{
                    ExtObject.updateAttributes({

                        Enabled: reqz.params.st

                    }).success(function (err) {
                        if (err) {
                            console.log("Extension update false ->", err);
                            logger.info('Error found in Updating : ' + err);
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                            resz.end(jsonString);
                        } else {
                            status = 1;
                            console.log("Extension updated successfully");
                            logger.info(' Updated Successfully');
                            resz.end();

                        }

                        try {

                            resz.send(status);
                            resz.end();

                        }
                        catch (exp) {

                            console.log("There is a error in --> Update Activate status ", exp);
                            logger.info('Exception Found in Updating : ' + exp);
                            var jsonString = messageFormatter.FormatMessage(exp, "ERROR", false, null);
                            resz.end(jsonString);

                        }

                    })
                }
                catch(ex)
                {
                    var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                    resz.end(jsonString);
                }
            }
            else {
                resz.send(status);
                resz.end();

            }

        });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        resz.end(jsonString);
    }
    //  return next();
}

function AddExtension(reqz,resz,errz) {
    logger.info('Starting new Extension creation .');
    try {
        var obj = reqz.body;

    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        resz.end(jsonString);
    }
    logger.info('Request json body  is converted as object : ' + obj);
    try{
        DbConn.Extension.find({where: [{Extension: obj.Extension}, {CompanyId: obj.CompanyId}, {TenantId: obj.TenantId}]}).complete(function (err, ExtObject) {

            logger.info('Searching Extension : ' + obj.Extension + ' CompanyID : ' + obj.CompanyId + ' TenentID : ' + obj.TenantId);

            // console.log(ExtObject);
            if (!!err) {
                console.log("An error occurred in searching Extension : " + obj.Extension);
                logger.info('Saving error. ');
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                resz.end(jsonString);
            }


            else if (ExtObject.length==0) {
                console.log("No record found for the Extension : " + obj.Extension);
                logger.info('No record Found. Extension : ' + obj.Extension);

                var result=CreateExtension(obj);
                if(result==1)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    resz.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    resz.end(jsonString);
                }




            }
            else if (ExtObject.length>0) {
                console.log(" Record is already available for the Extension : " + obj.Extension);
                var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, ExtObject);
                resz.end(jsonString);
            }

        });

    }
    catch (ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        resz.end(jsonString);
    }
}

function MapWithSipUacEndpoint(reqz,resz,errz) {

    logger.info('Starting mapping.(SipUAC Endpoint and Extension.)');
    try {
        var obj = reqz.body;
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        resz.end(jsonString);
    }
    logger.info('Request body json converts as object : ' + obj.values);

    try
    {
        DbConn.Extension.find({where: [{id: obj.Extensionid}]}).complete(function (err, ExtObject) {



            // console.log(ExtObject);
            if (!!err) {
                console.log("An error occurred in searching Extension : " + obj.Extensionid);
                logger.info('Error occurred in Searching Extension : ' + obj.Extensionid + ' Error : ' + err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                resz.end(jsonString);
            }


            else if (ExtObject.length==0) {
                console.log("No record found for the Extension : " + obj.Extensionid);
                logger.info('No record for Extension : ' + obj.Extensionid);
                var jsonString = messageFormatter.FormatMessage(null, "EMPTY", false, ExtObject);
                resz.end(jsonString);


            }
            else {
                logger.info('Searching for SipUACEndpoint : ' + obj.UACid);
                try
                {
                    DbConn.SipUACEndpoint.find({where: [{id: obj.UACid}]}).complete(function (err, SipObject) {



                        // console.log(ExtObject);
                        if (!!err) {
                            logger.info('Error in Searching for SipUACEndpoint : ' + obj.UACid);
                            console.log("An error occurred in searching Extension : " + obj.Extension + ' error : ' + err);
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, SipObject);
                            resz.end(jsonString);
                        }


                        else if (SipObject.length==0) {
                            logger.info('SipUACEndpoint not found: ' + obj.UACid);
                            console.log("No record found for the Extension : " + obj.Extension);
                            var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, SipObject);
                            resz.end(jsonString);

                        }
                        else {
                            logger.info('Both SipUAC : ' + obj.UACid + ' and Extension : ' + obj.Extensionid + ' found.');
                            /*  ExtObject.addSipUACEndpoint(SipObject).complete(function (errx, CloudEndInstancex)
                             {
                             console.log("...........................Mapping is succeeded ...................");
                             });
                             */
                            try{
                                DbConn.SipUACEndpoint
                                    .update(
                                    {
                                        ExtensionId: obj.ExtensionId


                                    },
                                    {
                                        where: [{id: obj.id}]
                                    }
                                ).then(function (result) {
                                        logger.info('Successfully Mapped. ');
                                        console.log(".......................mapping is succeeded ....................");
                                        var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                                        resz.end(jsonString);

                                    }).error(function (err) {
                                        logger.info('mapping error found in saving. : ' + err);
                                        console.log("mapping failed ! " + err);
                                        //handle error here
                                        var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                                        resz.end(jsonString);

                                    });
                            }
                            catch(ex)
                            {
                                var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                resz.end(jsonString);
                            }
                        }

                    });
                }
                catch(ex)
                {
                    var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                    resz.end(jsonString);
                }
            }

        });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        resz.end(jsonString);
    }

    return next();
}


function CreateExtension(jobj,result)
{
    logger.info( 'Saving new Extension.. ');
    try{
        DbConn.Extension
            .create(
            {
                Extension: jobj.Extension,
                ExtensionName: jobj.ExtensionName,
                Enabled: jobj.Enabled,
                ExtraData: jobj.ExtraData,
                ExtRefId: jobj.ExtRefId,
                CompanyId: jobj.CompanyId,
                TenantId: jobj.TenantId,
                ObjClass: jobj.ObjClass,
                ObjType: jobj.ObjType,
                ObjCategory: jobj.ObjCategory,
                AddUser: jobj.AddUser,
                UpdateUser: jobj.UpdateUser



            }
        ).complete(function (err, user) {
                /* ... */


                if (err == null) {
                    console.log("New User Found and Inserted (Extension : " + jobj.Extension + ")");
                    logger.info( 'Extension is created. values : '+jobj);
                    result=1;

                    //callback(err, true);
                    // pass null and true


                }
                else {
                    console.log("Error in saving  (Extension :" + jobj.Extension + ")" + err);
                    logger.info( 'Error Found in Saving  : '+err);
                    result=0;
                    // callback(err, false);
                    //pass error and false
                }
            });
        return result;

    }
    catch (ex)
    {
        console.log("Error found in saving data : "+ex);
        logger.info( 'Exception Found in Saving  : '+ex);
        result=0;
        return result;

    }

}


module.exports.ChangeAvailability = ChangeAvailability;
module.exports.AddExtension = AddExtension;
module.exports.MapWithSipUacEndpoint = MapWithSipUacEndpoint;