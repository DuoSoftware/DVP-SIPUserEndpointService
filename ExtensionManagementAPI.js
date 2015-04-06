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
function ChangeAvailability(reqz,callback) {
    logger.info('Start of Extension availability changing ');
    var status = 0;
    try {
        DbConn.Extension.find({where: {ExtRefId: reqz.params.ref}}).complete(function (err, ExtObject) {
            //logger.info('Requested RefID: ' + reqz.params.ref);
            // console.log(ExtObject);
            if (err) {
                callback("Error Returns", undefined);
            }
            else
            {

                if (ExtObject) {
                    logger.info('Updating Availability , RefID :' + reqz.params.ref);

                    try {
                        ExtObject.update(
                            {
                                Enabled: reqz.params.st

                            }
                        ).then(function (result) {
                                status = 1;
                                console.log("Extension updated successfully");
                                logger.info(' Updated Successfully');
                                var jsonString = messageFormatter.FormatMessage(null, "Availability changed successfully", true, result);
                                callback(undefined, result);

                            }).error(function (err) {
                                console.log("Extension update false ->");
                                logger.info('Error found in Updating : ' + result);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                callback("Error Found",undefined);

                            });
                    }
                    catch (ex) {
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback("Exception found", undefined);
                    }


                }
                else {
                    var jsonString = messageFormatter.FormatMessage(null, "ERROR", false, null);
                    callback("Error Occured", undefined);
                }
            }
        });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception found",undefined);
    }
    //  return next();
}

function AddExtension(reqz,callback) {
    logger.info('Starting new Extension creation .');
    try {
        var obj = reqz.body;
        console.log("object size :" +Object.keys(obj).length);

    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception",undefined);
    }
    logger.info('Request json body  is converted as object : ' + obj);


    try {
        DbConn.Extension.find({where: [{Extension: obj.Extension}, {CompanyId: obj.CompanyId}]}).complete(function (err, ExtObject) {

            logger.info('Searching Extension : ' + obj.Extension + ' CompanyID : ' + obj.CompanyId + ' TenentID : ' + obj.TenantId);

            // console.log(ExtObject);
            if (err) {
                console.log("An error occurred in searching Extension : " + obj.Extension);
                logger.info('Saving error. '+err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback("Error Found", undefined);
            }


            else
            {
                if (!ExtObject) {
                    console.log("No record found for the Extension : " + obj.Extension);
                    logger.info('No record Found. Extension : ' + obj.Extension);

                    CreateExtension(obj, function (res) {
                        if (res == 1) {
                            var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, res);
                            callback(undefined, res);
                        }
                        else {
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, res);
                            callback("Error", undefined);
                        }
                    });


                }
                else  {
                    console.log(" Record is already available for the Extension : " + obj.Extension);
                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", false, ExtObject);
                    callback("Already In Db", undefined);
                }
            }

        });

    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in searching Extension", false, null);
        callback("Exception",undefined);
    }


}

function MapWithSipUacEndpoint(reqz,callback) {

    logger.info('Starting mapping.(SipUAC Endpoint and Extension.)');
    try {
        var obj = reqz.body;
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in creating object", false, null);
        callback(null,jsonString);
    }
    logger.info('Request body json converts as object : ' + obj.values);

    try
    {
        DbConn.Extension.find({where: [{id: obj.ExtensionId}]}).complete(function (err, ExtObject) {


            if (err) {
                console.log("An error occurred in searching Extension : " + obj.ExtensionId);
                logger.info('Error occurred in Searching Extension : ' + obj.ExtensionId + ' Error : ' + err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback("Error", undefined);
            }


            else
            {

                if (!ExtObject ) {
                    console.log("No record found for the Extension : " + obj.ExtensionId);
                    logger.info('No record for Extension : ' + obj.ExtensionId);
                    var jsonString = messageFormatter.FormatMessage(null, "EMPTY object returns", false, ExtObject);
                    callback(undefined, undefined);


                }
                else {
                    logger.info('Searching for SipUACEndpoint : ' + obj.UACid);
                    try {
                        DbConn.SipUACEndpoint.find({where: [{id: obj.UACid}]}).complete(function (err, SipObject) {



                            // console.log(ExtObject);
                            if (err) {
                                logger.info('Error in Searching for SipUACEndpoint : ' + obj.UACid);
                                console.log("An error occurred in searching Extension : " + obj.Extension + ' error : ' + err);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, SipObject);
                                callback("Error", undefined);
                            }


                            else
                            {
                                if (!SipObject) {
                                    logger.info('SipUACEndpoint not found: ' + obj.UACid);
                                    console.log("No record found for the Extension : " + obj.SipExtension);
                                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, SipObject);
                                    callback(undefined, undefined);

                                }
                                else {
                                    logger.info('SIPUAC found : ' + obj.UACid);

                                    try {
                                        DbConn.SipUACEndpoint.find({where: [{SipExtension: obj.SipExtension}]}).complete(function (err, SipExtObject) {

                                            if (err) {
                                                logger.info('Error Found : ' + err);
                                                var jsonString = messageFormatter.FormatMessage(err, "An error occurred in searching Extension", false, SipExtObject);
                                                callback("Error", undefined);
                                            }


                                            else

                                            {
                                                if (!SipExtObject ) {

                                                    logger.info('No extension: ' + obj.SipExtension);

                                                    try {
                                                        DbConn.SipUACEndpoint
                                                            .update(
                                                            {
                                                                ExtensionId: obj.ExtensionId,
                                                                SipExtension: obj.SipExtension

                                                            },
                                                            {
                                                                where: [{id: obj.UACid}]
                                                            }
                                                        ).then(function (result) {
                                                                logger.info('Successfully Mapped. ');
                                                                console.log(".......................Mapping is succeeded ....................");
                                                                var jsonString = messageFormatter.FormatMessage(err, "Mapping is succeeded", true, result);
                                                                callback(undefined, result);

                                                            }).error(function (err) {
                                                                logger.info('mapping error found in saving. : ' + err);
                                                                console.log("mapping failed ! " + err);
                                                                //handle error here
                                                                var jsonString = messageFormatter.FormatMessage(err, "Mapping error found in saving", false, null);
                                                                callback("Error", undefined);

                                                            });
                                                    }
                                                    catch (ex) {
                                                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                                        callback("Exception", undefined);
                                                    }

                                                }
                                                else  {
                                                    var jsonString = messageFormatter.FormatMessage(err, "Cannot insert, Already taken", false, null);
                                                    callback(undefined, "Already in DB");
                                                }

                                            }

                                        });
                                    }
                                    catch (ex) {
                                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                        callback("Exception", undefined);
                                    }


                                }
                            }
                        });
                    }
                    catch (ex) {
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback("Exception", undefined);
                    }
                }
            }
        });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception", undefined);
    }

    //return next();
}


function CreateExtension(jobj,callback)
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


                if (!err ) {
                    console.log("New User Found and Inserted (Extension : " + jobj.Extension + ")");
                    logger.info( 'Extension is created. values : '+jobj);
                    callback(1);

                    //callback(err, true);
                    // pass null and true


                }
                else {
                    console.log("Error in saving  (Extension :" + jobj.Extension + ")" + err);
                    logger.info( 'Error Found in Saving  : '+err);
                    callback(0);
                    // callback(err, false);
                    //pass error and false
                }
            });


    }
    catch (ex)
    {
        console.log("Error found in saving data : "+ex);
        logger.info( 'Exception Found in Saving  : '+ex);

        callback(0);

    }

}


module.exports.ChangeAvailability = ChangeAvailability;
module.exports.AddExtension = AddExtension;
module.exports.MapWithSipUacEndpoint = MapWithSipUacEndpoint;