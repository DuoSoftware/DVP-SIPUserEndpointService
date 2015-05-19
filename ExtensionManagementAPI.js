/**
 * Created by pawan on 2/6/2015.
 */

var DbConn = require('DVP-DBModels');
var DbSave=require('./SaveSipUserData.js');
var restify = require('restify');
var winston=require('winston');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;

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


//post:-done
function ChangeAvailability(ref,st,reqId,callback) {
    //logger.info('Start of Extension availability changing ');
    var status = 0;
    try {
        DbConn.Extension.find({where: {ExtRefId: ref}}).complete(function (err, ExtObject) {
            //logger.info('Requested RefID: ' + reqz.params.ref);
            // console.log(ExtObject);
            if (err) {

                logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Error in searching ExtensionRefId %s ',reqId,ref,err);
                callback("Error Returns", undefined);
            }
            else
            {

                if (ExtObject) {
                    //logger.info('Updating Availability , RefID :' + reqz.params.ref);
                    logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s ',reqId,st,ref);

                    try {
                        ExtObject.update(
                            {
                                Enabled: reqz.params.st

                            }
                        ).then(function (result) {
                                status = 1;
                               // console.log("Extension updated successfully");
                                logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s is succeeded ',reqId,st,ref);
                                var jsonString = messageFormatter.FormatMessage(null, "Availability changed successfully", true, result);
                                callback(undefined, result);

                            }).error(function (err) {
                                console.log("Extension update false ->");
                                logger.error('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s is failed ',reqId,st,ref,err);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                callback("Error Found",undefined);

                            });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Exception in Updating status to %s of ExtensionRefId %s',reqId,st,ref,ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback("Exception found", undefined);
                    }


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,ref);
                    var jsonString = messageFormatter.FormatMessage(null, "ERROR", false, null);
                    callback("Error Occured", undefined);
                }
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Exception in searching Extension %s',reqId,ref,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception found",undefined);
    }
    //  return next();
}

function AddExtension(reqz,reqId,callback) {
    //logger.info('Starting new Extension creation .');
    try {
        var obj = reqz;
        console.log("object size :" +Object.keys(obj).length);

    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception",undefined);
    }
    logger.info('Request json body  is converted as object : ' + obj);


    try {
        DbConn.Extension.find({where: [{Extension: obj.Extension}, {CompanyId: obj.CompanyId}]}).complete(function (err, ExtObject) {

            //logger.info('Searching Extension : ' + obj.Extension + ' CompanyID : ' + obj.CompanyId + ' TenentID : ' + obj.TenantId);

            // console.log(ExtObject);
            if (err) {
                console.log("An error occurred in searching Extension : " + obj.Extension);
                logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,obj.Extension,err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback("Error Found", undefined);
            }


            else
            {
                if (!ExtObject) {
                    console.log("No record found for the Extension : " + obj.Extension);
                    logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,obj.Extension);

                    CreateExtension(obj,reqId,function (res) {
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

function MapWithSipUacEndpoint(reqz,reqId,callback) {

    //logger.info('Starting mapping.(SipUAC Endpoint and Extension.)');
    try {
        var obj = reqz;
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in creating object", false, null);
        callback(null,jsonString);
    }
    //logger.info('Request body json converts as object : ' + obj.values);

    try
    {
        DbConn.Extension.find({where: [{Extension: obj.Extension},{CompanyId:obj.CompanyId},{ObjType:'USER'}]}).complete(function (err, ExtObject) {


            if (err) {
                console.log("An error occurred in searching Extension : " + obj.ExtensionId);
                logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,obj.Extension,ex);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback("Error", undefined);
            }


            else
            {

                if (!ExtObject ) {
                    console.log("No record found for the Extension : " + obj.ExtensionId);
                    logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,obj.Extension);
                    var jsonString = messageFormatter.FormatMessage(null, "EMPTY object returns", false, ExtObject);
                    callback(undefined, undefined);


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Record found for Extension %s and Searching for SipUser %s ',reqId,obj.Extension,obj.UACid);
                    try {
                        DbConn.SipUACEndpoint.find({where: [{id: obj.UACid},{CompanyId:obj.CompanyId}]}).complete(function (err, SipObject) {



                            // console.log(ExtObject);
                            if (err) {
                                logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Error in searching SipUACEndpoint %s ',reqId,obj.UACid,err);
                                console.log("An error occurred in searching Extension : " + obj.Extension + ' error : ' + err);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, SipObject);
                                callback("Error", undefined);
                            }


                            else
                            {
                                if (!SipObject) {
                                    logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - No record found for SipUACEndpoint %s ',reqId,obj.UACid);
                                    console.log("No record found for the Extension : " + obj.SipExtension);
                                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, SipObject);
                                    callback(undefined, undefined);

                                }
                                else {
                                    logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Record found for SipUACEndpoint %s ',reqId,obj.UACid);

                                    try {
                                        DbConn.SipUACEndpoint.find({where: [{SipExtension: obj.SipExtension}]}).complete(function (err, SipExtObject) {

                                            if (err) {
                                                logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Error in searching SipUACEndpoint Extension  %s ',reqId, obj.SipExtension,err);
                                                var jsonString = messageFormatter.FormatMessage(err, "An error occurred in searching Extension", false, SipExtObject);
                                                callback("Error", undefined);
                                            }


                                            else

                                            {
                                                if (!SipExtObject ) {

                                                    logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - No record found for Extension  %s ',reqId, obj.SipExtension);

                                                    try {
                                                        DbConn.SipUACEndpoint
                                                            .update(
                                                            {
                                                                ExtensionId: ExtObject.id,
                                                                SipExtension: obj.SipExtension

                                                            },
                                                            {
                                                                where: [{id: obj.UACid}]
                                                            }
                                                        ).then(function (result) {
                                                                logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Mapping succeeded - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,obj.UACid);
                                                                console.log(".......................Mapping is succeeded ....................");
                                                                var jsonString = messageFormatter.FormatMessage(err, "Mapping is succeeded", true, result);
                                                                callback(undefined, result);

                                                            }).error(function (err) {
                                                                logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Mapping failed - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,obj.UACid,err);
                                                                console.log("mapping failed ! " + err);
                                                                //handle error here
                                                                var jsonString = messageFormatter.FormatMessage(err, "Mapping error found in saving", false, null);
                                                                callback("Error", undefined);

                                                            });
                                                    }
                                                    catch (ex) {
                                                        logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Exception in Mapping - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,obj.UACid,ex);
                                                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                                        callback("Exception", undefined);
                                                    }

                                                }
                                                else  {
                                                    logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Record in already in DB - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,obj.UACid);
                                                    var jsonString = messageFormatter.FormatMessage(err, "Cannot insert, Already taken", false, null);
                                                    callback(undefined, "Already in DB");
                                                }

                                            }

                                        });
                                    }
                                    catch (ex) {
                                        logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Exception in searching SipUACEndpoints SipExtension %s ',reqId,obj.SipExtension,ex);
                                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                        callback("Exception", undefined);
                                    }


                                }
                            }
                        });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Exception in searching SipUACEndpoints ID %s ',reqId,obj.UACid,ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback("Exception", undefined);
                    }
                }
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Exception in searching Extension %s ',reqId,obj.Extension,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception", undefined);
    }

    //return next();
}

function MapwithGroup(reqz,reqId,callback)
{
    //logger.info('Starting mapping.(Group and Extension.)');
    try {
        var obj = reqz;
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in creating object", false, null);
        callback(null,jsonString);
    }
    //logger.info('Request body json converts as object : ' + obj.values);

    try
    {
        DbConn.Extension.find({where: [{id: obj.ExtensionId},{CompanyId:obj.CompanyId},{ObjType:'GROUP'}]}).complete(function (err, ExtObject) {


            if (err) {
                console.log("An error occurred in searching Extension : " + obj.ExtensionId);
                logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,obj.ExtensionId,err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback("Error", undefined);
            }


            else
            {

                if (!ExtObject ) {
                    console.log("No record found for the Extension : " + obj.ExtensionId);
                    logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,obj.ExtensionId);
                    var jsonString = messageFormatter.FormatMessage(null, "EMPTY object returns", false, ExtObject);
                    callback(undefined, undefined);


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Record found for Extension %s and searching for UserGroup %s',reqId,obj.ExtensionId,obj.GroupID);
                    try {
                        DbConn.UserGroup.find({where: [{id: obj.GroupID},{CompanyId:obj.CompanyId}]}).complete(function (err, GrpObject) {



                            // console.log(ExtObject);
                            if (err) {
                                logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Error in searching for UserGroup %s',reqId,obj.GroupID,err);
                                console.log("An error occurred in searching Extension : " + obj.Extension + ' error : ' + err);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, GrpObject);
                                callback("Error", undefined);
                            }


                            else
                            {
                                if (!GrpObject) {
                                    logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - No record found for UserGroup %s',reqId,obj.GroupID);
                                    //console.log("No record found for the Extension : " + obj.SipExtension);
                                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, GrpObject);
                                    callback(undefined, undefined);

                                }
                                else {
                                    //logger.info('Group found : ' + obj.GroupID);
                                    logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Record found for UserGroup %s',reqId,obj.GroupID);

                                    try {
                                        /*
                                        GrpObject.addExtension(ExtObject).complete(function (errx, groupInstancex)
                                        {
                                            if(errx)
                                            {
                                                callback(errx,undefined);
                                            }
                                            else
                                            {
                                                callback(undefined,groupInstancex);
                                            }
                                        });
                                        */

                                        DbConn.UserGroup
                                            .update(
                                            {
                                                ExtensionId: obj.ExtensionId


                                            },
                                            {
                                                where: [{id: obj.GroupID},{CompanyId:obj.CompanyId}]
                                            }
                                        ).then(function (result) {
                                                //logger.info('Successfully Updated. ');
                                                //log.info("Extention and Group mapped  : "+result);
                                                logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Mapping UserGroup %s with Extension %s is succeeded',reqId,obj.GroupID,obj.ExtensionId);
                                                //var jsonString = messageFormatter.FormatMessage(null, "Maxlimit successfully updated for : "+req.LimitId, true, result);
                                                callback(undefined, result);

                                            }).error(function (err) {
                                                //logger.info('updation error found in saving. : ' + err);
                                               //log.info("Error in mapping group and extention");
                                                console.log("updation failed ! " + err);
                                                logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Mapping UserGroup %s with Extension %s is failed',reqId,obj.GroupID,obj.ExtensionId,err);
                                                //handle error here
                                                var jsonString = messageFormatter.FormatMessage(err, "updation", false, null);
                                                callback(err, undefined);

                                            });

                                    }
                                    catch (ex) {
                                        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Exception in Mapping UserGroup %s with Extension %s ',reqId,obj.GroupID,obj.ExtensionId,ex);
                                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                        callback("Exception", undefined);
                                    }


                                }
                            }
                        });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Exception in Searching UserGroup %s ',reqId,obj.GroupID,ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback("Exception", undefined);
                    }
                }
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Exception in Searching Extension %s ',reqId, obj.ExtensionId,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception", undefined);
    }

}

function CreateExtension(jobj,reqId,callback)
{
    //logger.info( 'Saving new Extension.. ');
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
                    logger.debug('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  -  Extension %s insertion succeeded ',reqId,jobj.Extension);
                    callback(1);

                    //callback(err, true);
                    // pass null and true


                }
                else {
                    console.log("Error in saving  (Extension :" + jobj.Extension + ")" + err);
                    logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  -  Extension %s insertion failed ',reqId,jobj.Extension,err);
                    callback(0);
                    // callback(err, false);
                    //pass error and false
                }
            });


    }
    catch (ex)
    {
        console.log("Error found in saving data : "+ex);
        logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  -  Exception in saving Extension %s ',reqId,jobj.Extension,ex);

        callback(0);

    }

}


module.exports.ChangeAvailability = ChangeAvailability;
module.exports.AddExtension = AddExtension;
module.exports.MapWithSipUacEndpoint = MapWithSipUacEndpoint;
module.exports.MapwithGroup = MapwithGroup;