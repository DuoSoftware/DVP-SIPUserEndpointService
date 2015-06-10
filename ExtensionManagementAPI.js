/**
 * Created by pawan on 2/6/2015.
 */

var DbConn = require('DVP-DBModels');
//var DbSave=require('./SaveSipUserData.js');
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

var AddEmergencyNumberDB = function(reqId, emergencyNumInfo, callback)
{
    try
    {
        DbConn.EmergencyNumber.find({where: [{EmergencyNum: emergencyNumInfo.EmergencyNumber},{TenantId: emergencyNumInfo.TenantId}]})
            .complete(function (err, numData)
            {
                if(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - Get Emergency Numbers PGSQL query failed', reqId, err);
                    callback(err, false, -1);
                }
                else if(numData)
                {
                    logger.debug('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - Get Emergency Numbers PGSQL query success', reqId);
                    callback(new Error('Emergency number already added for tenant'), false, numData.id);
                }
                else
                {
                    logger.debug('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - Get Emergency Numbers PGSQL query success', reqId);
                    var emerNum = DbConn.EmergencyNumber.build({

                        EmergencyNum: emergencyNumInfo.EmergencyNumber,
                        CompanyId: emergencyNumInfo.CompanyId,
                        TenantId: emergencyNumInfo.TenantId,
                        ObjClass: 'DVP',
                        ObjType: 'EMERGENCY_NUM',
                        ObjCategory: 'OUTBOUND'
                    });

                    emerNum
                        .save()
                        .complete(function (err)
                        {
                            if (err)
                            {
                                logger.error('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - PGSQL query failed', reqId, err);
                                callback(err, false, -1);
                            }
                            else
                            {
                                logger.debug('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - PGSQL query success', reqId);
                                callback(undefined, true, emerNum.id);
                            }

                        })
                }

            })


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false, -1);
    }

};

var DeleteEmergencyNumberDB = function(reqId, emergencyNum, companyId, tenantId, callback)
{
    try
    {
        DbConn.EmergencyNumber.find({where: [{EmergencyNum: emergencyNum},{CompanyId: companyId},{TenantId: tenantId}]}).complete(function (err, eNumRec)
        {
            if (err)
            {
                logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query failed', reqId, err);
                callback(err, false);
            }
            else if(eNumRec)
            {
                eNumRec.destroy().complete(function (err, result)
                {
                    if(err)
                    {
                        logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query success', err);
                        callback(err, true);
                    }
                });
            }
            else
            {
                logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query success', reqId);
                callback(undefined, true);
            }

        })

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var GetEmergencyNumbersForCompany = function(reqId, companyId, tenantId, callback)
{
    var emptyArr = [];
    try
    {
        DbConn.EmergencyNumber.findAll({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, eNumData)
            {
                if(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.GetEmergencyNumbersForCompany] - [%s] - Get emergency numbers PGSQL query failed', reqId, err);
                    callback(err, emptyArr);
                }
                else
                {
                    logger.debug('[DVP-SIPUserEndpointService.GetEmergencyNumbersForCompany] - [%s] - Get emergency numbers PGSQL query success', reqId);
                    callback(undefined, eNumData);
                }

            });
    }
    catch(ex)
    {
        callback(ex, emptyArr);
    }

};

var GetAllUserDataForExt = function(reqId, extension, tenantId, callback)
{
    try
    {
        DbConn.Extension.find({where: [{Extension: extension},{TenantId: tenantId}]})
            .complete(function (err, extData)
            {
                if(err)
                {
                    callback(err, undefined);
                }
                else if(extData)
                {
                    if(extData.ObjCategory === 'USER')
                    {
                        DbConn.Extension.find({where: [{Extension: extension},{TenantId: tenantId}], include: [{model: DbConn.SipUACEndpoint, as:'SipUACEndpoint', include: [{model: DbConn.CloudEndUser, as:'CloudEndUser'},{model: DbConn.UserGroup, as:'UserGroup', include: [{model: DbConn.Extension, as:'Extension'}]}]}]})
                            .complete(function (err, extData)
                            {
                                callback(err, extData);
                            });
                    }
                    else
                    {
                        callback(undefined, undefined);
                    }

                }
                else
                {
                    callback(undefined, undefined);
                }

            });
    }
    catch(ex)
    {
        callback(ex, false);
    }

};

var SetDodNumberToExtDB = function(reqId, dodNumber, extId, companyId, tenantId, isActive, callback)
{
    try
    {
        DbConn.Extension.find({where: [{TenantId: tenantId},{CompanyId: companyId},{id: extId}]}).complete(function (err, ext)
        {
            if(err)
            {
                logger.error('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] - [%s] - Get Extension PGSQL query failed', reqId, err);
                callback(err, false);
            }
            else if(ext)
            {
                logger.debug('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] - [%s] - Get Extension PGSQL query success', reqId);

                ext.updateAttributes({DodActive: isActive.toString(), DodNumber: dodNumber}).complete(function (err)
                {
                    if(err)
                    {
                        logger.error('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] PGSQL Update Dod Number query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.info('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] PGSQL Update Dod Number query success');
                        callback(undefined, true);
                    }

                });

            }
            else
            {
                callback(new Error('Extension record not found'), false);
            }

        });


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};

var DeleteDidNumberDB = function(reqId, didNumId, companyId, tenantId, callback)
{
    try
    {
        DbConn.DidNumber.find({where: [{id: didNumId},{CompanyId: companyId},{TenantId: tenantId}]}).complete(function (err, didRec)
        {
            if (err)
            {
                logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query failed', reqId, err);
                callback(err, false);
            }
            else if(didRec)
            {
                didRec.destroy().complete(function (err, result)
                {
                    if(err)
                    {
                        logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query success', err);
                        callback(err, true);
                    }
                });
            }
            else
            {
                logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query success', reqId);
            }

        })

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

var AddDidNumberDB = function(reqId, didNumberInfo, callback)
{
    try
    {
        DbConn.DidNumber.find({where: [{TenantId: didNumberInfo.TenantId},{DidNumber: didNumberInfo.DidNumber}]}).complete(function (err, didRec)
        {
            if(err)
            {
                logger.error('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - Get Did Number PGSQL query failed', reqId, err);
                callback(err, false, -1);
            }
            else if(didRec)
            {
                logger.debug('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - Get Did Number PGSQL query success', reqId);
                callback(new Error('DidNumber already added'), false, -1);
            }
            else
            {
                logger.debug('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - Get Did Number PGSQL query success', reqId);
                //save ok
                var didNum = DbConn.DidNumber.build({

                    DidNumber: didNumberInfo.DidNumber,
                    DidActive: didNumberInfo.DidActive,
                    CompanyId: didNumberInfo.CompanyId,
                    TenantId: didNumberInfo.TenantId,
                    ObjClass: 'PBX',
                    ObjType: 'NUMBER_MAPPING',
                    ObjCategory: 'DID'
                });

                didNum
                    .save()
                    .complete(function (err)
                    {
                        if (err)
                        {
                            logger.error('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - PGSQL query failed', reqId, err);
                            callback(err, false, -1);
                        }
                        else
                        {
                            logger.debug('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - PGSQL query success', reqId);
                            callback(undefined, true, didNum.id);
                        }

                    })
            }

        });


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false, -1);
    }
};

var GetDidNumbersForCompanyDB = function(reqId, companyId, tenantId, callback)
{
    var emptyArr = [];
    try
    {
        DbConn.DidNumber.findAll({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, didNumList)
            {
                if (err)
                {
                    logger.error('[DVP-SIPUserEndpointService.GetDidNumbersForCompanyDB] - [%s] - PGSQL get did numbers for company query failed', reqId, err);
                    callback(err, emptyArr);
                }
                else
                {
                    logger.debug('[DVP-SIPUserEndpointService.GetDidNumbersForCompanyDB] - [%s] - PGSQL get did numbers for company query success', reqId);
                    callback(err, didNumList);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.GetDidNumbersForCompanyDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, emptyArr);
    }

};

var AssignDidNumberToExtDB = function(reqId, didNumId, extId, companyId, tenantId, callback)
{
    try
    {
        DbConn.Extension.find({where: [{id: extId},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (err, extInf)
            {
                if(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get Extension query failed', reqId, err);
                    callback(err, false);
                }
                else if(extInf)
                {
                    logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get Extension query success', reqId);

                    DbConn.DidNumber.find({where: [{id: didNumId},{CompanyId: companyId},{TenantId: tenantId}]})
                        .complete(function (err, didNum)
                        {
                            if(err)
                            {
                                logger.error('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get did number query failed', reqId, err);
                                callback(err, false);
                            }
                            else if(didNum)
                            {
                                logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get didnumber query success', reqId);
                                didNum.setExtension(extInf).complete(function (err, result)
                                {
                                    if(err)
                                    {
                                        logger.error('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Update did number with extension query failed', reqId, err);
                                        callback(err, false);
                                    }
                                    else
                                    {
                                        logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Update did number with extension query success', reqId);
                                        callback(err, true);
                                    }

                                });
                            }
                            else
                            {
                                logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get did number query success', reqId);
                                logger.warn('DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - Extension not found', reqId);

                                callback(new Error('Extension not found'), false);
                            }
                        });
                }
                else
                {
                    logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get Extension query success', reqId);
                    logger.warn('DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - Extension not found', reqId);

                    callback(new Error('Extension not found'), false);
                }
            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};



var SetDidNumberActiveStatusDB = function(reqId, didNumId, companyId, tenantId, isActive, callback)
{
    try
    {
        DbConn.DidNumber.find({where: [{TenantId: tenantId},{CompanyId: companyId},{id: didNumId}]}).complete(function (err, didRec)
        {
            if(err)
            {
                logger.error('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] - [%s] - Get Did Number PGSQL query failed', reqId, err);
                callback(err, false);
            }
            else if(didRec)
            {
                logger.debug('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] - [%s] - Get Did Number PGSQL query success', reqId);

                didRec.updateAttributes({DidActive: isActive.toString()}).complete(function (err)
                {
                    if(err)
                    {
                        logger.error('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] PGSQL Update Did Status query failed', err);
                        callback(err, false);
                    }
                    else
                    {
                        logger.info('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] PGSQL Update Did Status query success');
                        callback(undefined, true);
                    }

                });

            }
            else
            {
                callback(new Error('Did record not found'), false);
            }

        });


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }
};

















//post:-done
function ChangeAvailability(Id,st,reqId,callback) {
    //logger.info('Start of Extension availability changing ');
    var status = 0;
    try {
        DbConn.Extension.find({where: {id: Id}}).complete(function (err, ExtObject) {
            //logger.info('Requested RefID: ' + reqz.params.ref);
            // console.log(ExtObject);
            if (err) {

                logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Error in searching ExtensionRefId %s ',reqId,Id,err);
                callback(err, undefined);
            }
            else
            {

                if (ExtObject) {
                    //logger.info('Updating Availability , RefID :' + reqz.params.ref);
                    logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s ',reqId,st,Id);

                    //var ststs=Boolean(st);
                    //console.log("St "+ststs);
                    try {
                        ExtObject.updateAttributes(
                            {
                                Enabled: st

                            }
                        ).then(function (result) {
                                status = 1;
                                // console.log("Extension updated successfully");
                                logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s is succeeded ',reqId,st,Id);
                                var jsonString = messageFormatter.FormatMessage(null, "Availability changed successfully", true, result);
                                callback(undefined, result);

                            }).error(function (err) {
                                console.log("Extension update false ->");
                                logger.error('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s is failed ',reqId,st,Id,err);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                callback("Error Found",undefined);

                            });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Exception in Updating status to %s of ExtensionRefId %s',reqId,st,Id,ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback("Exception found", undefined);
                    }


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Id);
                    var jsonString = messageFormatter.FormatMessage(null, "ERROR", false, null);
                    callback("Error Occurred", undefined);
                }
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [PGSQL]  - Exception in searching Extension %s',reqId,Id,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception found",undefined);
    }
    //  return next();
}

function AddExtension(reqz,reqId,callback) {
    //logger.info('Starting new Extension creation .');
    try {
        var obj = reqz;
        // console.log("object size :" +Object.keys(obj).length);

    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback(ex,undefined);
    }
    logger.info('Request json body  is converted as object : ' + obj);


    try {
        DbConn.Extension.find({where: [{Extension: obj.Extension}, {CompanyId: obj.CompanyId}]}).complete(function (err, ExtObject) {

            //logger.info('Searching Extension : ' + obj.Extension + ' CompanyID : ' + obj.CompanyId + ' TenentID : ' + obj.TenantId);

            // console.log(ExtObject);
            if (err) {
                //  console.log("An error occurred in searching Extension : " + obj.Extension);
                logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,obj.Extension,err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback(ex, undefined);
            }


            else
            {
                if (!ExtObject) {
                    //   console.log("No record found for the Extension : " + obj.Extension);
                    logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,obj.Extension);

                    CreateExtension(obj,reqId,function (res) {
                        if (res == 1) {
                            var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, res);
                            callback(undefined, res);
                        }
                        else {
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, res);
                            callback(new Error("Error"), undefined);
                        }
                    });


                }
                else  {
                    // console.log(" Record is already available for the Extension : " + obj.Extension);
                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", false, ExtObject);
                    callback(new Error("Already In Db"), undefined);
                }
            }

        });

    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in searching Extension", false, null);
        callback("Exception",undefined);
    }


}

function MapWithSipUacEndpoint(Ext,UAC,reqz,reqId,callback) {

    //logger.info('Starting mapping.(SipUAC Endpoint and Extension.)');
    try {
        var obj = reqz;
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in creating object", false, null);
        callback(undefined,jsonString);
    }
    //logger.info('Request body json converts as object : ' + obj.values);

    try
    {
        DbConn.Extension.find({where: [{id: Ext},{CompanyId:obj.CompanyId},{ObjType:'USER'}]}).complete(function (err, ExtObject) {


            if (err) {
                //console.log("An error occurred in searching Extension : " + Ext);
                logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,ex);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback("Error", undefined);
            }


            else
            {

                if (!ExtObject ) {
                    //console.log("No record found for the Extension : " + obj.ExtensionId);
                    logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);
                    var jsonString = messageFormatter.FormatMessage(null, "EMPTY object returns", false, ExtObject);
                    callback("No Extension record found", undefined);


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Record found for Extension %s and Searching for SipUser %s ',reqId,Ext,UAC);
                    try {
                        DbConn.SipUACEndpoint.find({where: [{id: UAC},{CompanyId:'1'}]}).complete(function (err, SipObject) {



                            // console.log(ExtObject);
                            if (err) {
                                logger.error('[DVP-LimitHandler.MapExtension] - [%s] - [PGSQL]  - Error in searching SipUACEndpoint %s ',reqId,UAC,err);
                                //console.log("An error occurred in searching Extension : " + obj.Extension + ' error : ' + err);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, SipObject);
                                callback("Error", undefined);
                            }


                            else
                            {
                                if (!SipObject) {
                                    logger.error('[DVP-LimitHandler.MapExtension] - [%s] - [PGSQL]  - No record found for SipUACEndpoint %s ',reqId,UAC);
                                    //console.log("No record found for the Extension : " + obj.SipExtension);
                                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, SipObject);
                                    callback("No SIPUser record found", undefined);

                                }
                                else {
                                    logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Record found for SipUACEndpoint %s ',reqId,UAC);

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
                                                                where: [{id: UAC}]
                                                            }
                                                        ).then(function (result) {
                                                                logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Mapping succeeded - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC);
                                                                // console.log(".......................Mapping is succeeded ....................");
                                                                var jsonString = messageFormatter.FormatMessage(err, "Mapping is succeeded", true, result);
                                                                callback(undefined, result);

                                                            }).error(function (err) {
                                                                logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Mapping failed - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC,err);
                                                                // console.log("mapping failed ! " + err);
                                                                //handle error here
                                                                var jsonString = messageFormatter.FormatMessage(err, "Mapping error found in saving", false, null);
                                                                callback("Error", undefined);

                                                            });
                                                    }
                                                    catch (ex) {
                                                        logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Exception in Mapping - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC,ex);
                                                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                                        callback("Exception", undefined);
                                                    }

                                                }
                                                else  {
                                                    logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Record in already in DB - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC);
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
                        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Exception in searching SipUACEndpoints ID %s ',reqId,UAC,ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback("Exception", undefined);
                    }
                }
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [PGSQL]  - Exception in searching Extension %s ',reqId,Ext,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback("Exception", undefined);
    }

    //return next();
}

function MapwithGroup(Ext,Grp,reqId,callback)
{

    /* try {
     var obj = reqz;
     }
     catch (ex) {
     var jsonString = messageFormatter.FormatMessage(ex, "Exception in creating object", false, null);
     callback(null,jsonString);
     }


     try
     {
     DbConn.Extension.find({where: [{id: Ext},{CompanyId:obj.CompanyId},{ObjType:'GROUP'}]}).complete(function (err, ExtObject) {


     if (err) {
     // console.log("An error occurred in searching Extension : " + Ext);
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,err);
     var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
     callback("Error", undefined);
     }


     else
     {

     if (!ExtObject ) {
     console.log("No record found for the Extension : " + obj.ExtensionId);
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);
     var jsonString = messageFormatter.FormatMessage(null, "EMPTY object returns", false, ExtObject);
     callback(undefined, undefined);


     }
     else {
     logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Record found for Extension %s and searching for UserGroup %s',reqId,Ext,Grp);
     try {
     DbConn.UserGroup.find({where: [{id: Grp},{CompanyId:obj.CompanyId}]}).complete(function (err, GrpObject) {



     // console.log(ExtObject);
     if (err) {
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Error in searching for UserGroup %s',reqId,Grp,err);
     // console.log("An error occurred in searching Extension : " + obj.Extension + ' error : ' + err);
     var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, GrpObject);
     callback("Error", undefined);
     }


     else
     {
     if (!GrpObject) {
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - No record found for UserGroup %s',reqId,Grp);
     //console.log("No record found for the Extension : " + obj.SipExtension);
     var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, GrpObject);
     callback(undefined, undefined);

     }
     else {
     //logger.info('Group found : ' + obj.GroupID);
     logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Record found for UserGroup %s',reqId,Grp);

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
    /*
     DbConn.UserGroup
     .update(
     {
     ExtensionId: Ext


     },
     {
     where: [{id: Grp},{CompanyId:obj.CompanyId}]
     }
     ).then(function (result) {
     //logger.info('Successfully Updated. ');
     //log.info("Extention and Group mapped  : "+result);
     logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Mapping UserGroup %s with Extension %s is succeeded',reqId,Grp,Ext);
     //var jsonString = messageFormatter.FormatMessage(null, "Maxlimit successfully updated for : "+req.LimitId, true, result);
     callback(undefined, result);

     }).error(function (err) {
     //logger.info('updation error found in saving. : ' + err);
     //log.info("Error in mapping group and extention");
     console.log("updation failed ! " + err);
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Mapping UserGroup %s with Extension %s is failed',reqId,Grp,Ext,err);
     //handle error here
     var jsonString = messageFormatter.FormatMessage(err, "updation", false, null);
     callback(err, undefined);

     });

     }
     catch (ex) {
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Exception in Mapping UserGroup %s with Extension %s ',reqId,Grp,Ext,ex);
     var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
     callback("Exception", undefined);
     }


     }
     }
     });
     }
     catch (ex) {
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Exception in Searching UserGroup %s ',reqId,Grp,ex);
     var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
     callback("Exception", undefined);
     }
     }
     }
     });
     }
     catch(ex)
     {
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [PGSQL]  - Exception in Searching Extension %s ',reqId,Ext,ex);
     var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
     callback("Exception", undefined);
     }
     */

    try {
        DbConn.Extension.find({where: [{id: Ext}]}).complete(function (err, ExtObject) {

            if (err) {
                logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Error in searching Extension - Extension %s Group % ',reqId,Ext,err);
                callback(err, undefined);
            }

            else
            {
                if (ExtObject) {
                    logger.debug('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Extension found -  Data - %s',reqId,JSON.stringify(ExtObject));
                    //console.log(ExtObject);

                    try {
                        DbConn.UserGroup.find({where: [{id: Grp}]}).complete(function (errz, groupObject) {
                            if (errz) {
                                logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Error in searching UserGroup %s ',reqId,Grp,errz);
                                callback(errz, undefined);
                            }

                            else if (groupObject!=null) {
                                logger.debug('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - UserGroup %s found.Mapping is starting ',reqId,Grp);

                                try {
                                    groupObject.setExtension(ExtObject).complete(function (errx, groupInstancex) {

                                        if (errx) {
                                            logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Error in Mapping Extension %s with Group %s -  Data - %s',reqId,ExtObject.id,groupObject.id,errx);
                                            callback(errx, undefined)
                                        }
                                        else  {
                                            logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Mapping Extension %s with Group %s is succeeded -  Data - %s',reqId,ExtObject.id,groupObject.id);
                                            callback(undefined, groupInstancex)
                                        }


                                        //console.log('mapping group and sip done.................');



                                    });
                                }
                                catch (ex) {
                                    logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Exception in Mapping Extension %s with Group %s -  Data - %s',reqId,ExtObject.id,groupObject.id);
                                    callback(ex, undefined);
                                }

                            }

                            else {
                                logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - No record found for group %s  ',reqId,Grp);
                                callback("No group record found", undefined);
                            }

                        })

                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Exception in searching group %s  ',reqId,Grp,ex);
                        callback(ex, undefined);
                    }


                }
                else {
                    logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - No record found for Extension %s  ',reqId,Ext);
                    callback(err, sipObject);

                }
            }

        });



    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [PGSQL]  - Exception in starting method : MapwithGroup  - Extension %s Group % ',reqId,Ext,Grp,ex);
        callback(ex,undefined);
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
                ObjClass: "OBJCLZ",
                ObjType: "USER",
                ObjCategory: "OBJCAT",
                CompanyId: 1,
                TenantId: 1,
                AddUser: jobj.AddUser,
                UpdateUser: jobj.UpdateUser



            }
        ).complete(function (err, user) {
                /* ... */


                if (!err ) {
                    //console.log("New User Found and Inserted (Extension : " + jobj.Extension + ")");
                    logger.debug('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  -  Extension %s insertion succeeded ',reqId,jobj.Extension);
                    callback(1);

                    //callback(err, true);
                    // pass null and true


                }
                else {
                    // console.log("Error in saving  (Extension :" + jobj.Extension + ")" + err);
                    logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  -  Extension %s insertion failed ',reqId,jobj.Extension,err);
                    callback(0);
                    // callback(err, false);
                    //pass error and false
                }
            });


    }
    catch (ex)
    {
        //console.log("Error found in saving data : "+ex);
        logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  -  Exception in saving Extension %s ',reqId,jobj.Extension,ex);

        callback(0);

    }

}

function GetUserDataOfExtension(Ext,Tenant,reqId,callback)
{
    //logger.info( 'Saving new Extension.. ');
    try {
        DbConn.Extension.find({where: [{Extension: Ext}, {TenantId: Tenant}],include: [{model: DbConn.SipUACEndpoint, as: "SipUACEndpoint"}]}).complete(function (err, ExtObject) {

            //logger.info('Searching Extension : ' + obj.Extension + ' CompanyID : ' + obj.CompanyId + ' TenentID : ' + obj.TenantId);

            // console.log(ExtObject);
            if (err) {
                //  console.log("An error occurred in searching Extension : " + obj.Extension);
                logger.error('[DVP-SIPUserEndpointService.GetUserDataOfExtension] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,err);
                //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback(err, undefined);
            }


            else
            {
                if (!ExtObject) {
                    //   console.log("No record found for the Extension : " + obj.Extension);
                    logger.error('[DVP-SIPUserEndpointService.GetUserDataOfExtension] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);

                    //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, res);
                    callback("EMPTY", undefined);

                }



                else  {
                    // console.log(" Record is already available for the Extension : " + obj.Extension);
                    //var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", false, ExtObject);
                    logger.debug('[DVP-SIPUserEndpointService.GetUserDataOfExtension] - [%s] - [PGSQL]  - User records found for Extension %s ',reqId,Ext);
                    callback(undefined, ExtObject);
                }
            }

        });

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.GetUserDataOfExtension] - [%s] - [PGSQL]  - Exception occurred  %s ',reqId,Ext);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        callback(ex,undefined);
    }

}

function GetExtensionsOfCompany(Company,Tenant,reqId,callback)
{
    //logger.info( 'Saving new Extension.. ');
    try {
        DbConn.Extension.findAll({where: [{CompanyId: Company}, {TenantId: Tenant}]}).complete(function (err, ExtObject) {

            //logger.info('Searching Extension : ' + obj.Extension + ' CompanyID : ' + obj.CompanyId + ' TenentID : ' + obj.TenantId);

            // console.log(ExtObject);
            if (err) {
                //  console.log("An error occurred in searching Extension : " + obj.Extension);
                logger.error('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - [PGSQL]  - Error in searching Company %s ',reqId,Company,err);
                //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback(err, undefined);
            }


            else
            {
                if (!ExtObject) {
                    //   console.log("No record found for the Extension : " + obj.Extension);
                    logger.error('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - [PGSQL]  - No record found for Company %s ',reqId,Company);

                    //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, res);
                    callback(new Error("EMPTY"), undefined);

                }



                else  {
                    // console.log(" Record is already available for the Extension : " + obj.Extension);
                    //var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", false, ExtObject);
                    logger.debug('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - [PGSQL]  - Extension records found for Company %s ',reqId,Company);
                    callback(undefined, ExtObject);
                }
            }

        });

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - [PGSQL]  - Exception occurred  %s ',reqId,Company,ex);
       // var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, null);
        callback(ex,undefined);
    }

}
function GetExtensions(Ext,Company,Tenant,reqId,callback)
{
    //logger.info( 'Saving new Extension.. ');
    try {
        DbConn.Extension.find({where: [{CompanyId: Company},{Extension: Ext}, {TenantId: Tenant}]}).complete(function (err, ExtObject) {

            //logger.info('Searching Extension : ' + obj.Extension + ' CompanyID : ' + obj.CompanyId + ' TenentID : ' + obj.TenantId);

            // console.log(ExtObject);
            if (err) {
                //  console.log("An error occurred in searching Extension : " + obj.Extension);
                logger.error('[DVP-SIPUserEndpointService.GetExtensions] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,err);
                //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ExtObject);
                callback(err, undefined);
            }


            else
            {
                if (!ExtObject) {
                    //   console.log("No record found for the Extension : " + obj.Extension);
                    logger.error('[DVP-SIPUserEndpointService.GetExtensions] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);

                    //var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, res);
                    callback("EMPTY", undefined);

                }



                else  {
                    // console.log(" Record is already available for the Extension : " + obj.Extension);
                    //var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", false, ExtObject);
                    logger.debug('[DVP-SIPUserEndpointService.GetExtensions] - [%s] - [PGSQL]  - Extension records found for Extension %s ',reqId,Ext);
                    callback(undefined, ExtObject);
                }
            }

        });

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.GetExtensions] - [%s] - [PGSQL]  - Exception occurred  %s ',reqId,Ext,ex);
        // var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, null);
        callback(ex,undefined);
    }

}


module.exports.ChangeAvailability = ChangeAvailability;
module.exports.AddExtension = AddExtension;
module.exports.MapWithSipUacEndpoint = MapWithSipUacEndpoint;
module.exports.MapwithGroup = MapwithGroup;
module.exports.GetUserDataOfExtension = GetUserDataOfExtension;
module.exports.GetExtensionsOfCompany = GetExtensionsOfCompany;
module.exports.GetExtensions = GetExtensions;
module.exports.GetAllUserDataForExt = GetAllUserDataForExt;
module.exports.AddDidNumberDB = AddDidNumberDB;
module.exports.SetDidNumberActiveStatusDB = SetDidNumberActiveStatusDB;
module.exports.DeleteDidNumberDB = DeleteDidNumberDB;
module.exports.GetDidNumbersForCompanyDB = GetDidNumbersForCompanyDB;
module.exports.AssignDidNumberToExtDB = AssignDidNumberToExtDB;
module.exports.SetDodNumberToExtDB = SetDodNumberToExtDB;
module.exports.AddEmergencyNumberDB = AddEmergencyNumberDB;
module.exports.DeleteEmergencyNumberDB = DeleteEmergencyNumberDB;
module.exports.GetEmergencyNumbersForCompany = GetEmergencyNumbersForCompany;