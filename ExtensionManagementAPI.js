/**
 * Created by pawan on 2/6/2015.
 */

var DbConn = require('DVP-DBModels');
var restify = require('restify');
var winston=require('winston');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;



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

var GetUsersOfExtension = function(reqId, extension, tenantId,Company,callback)
{
    try
    {

        DbConn.Extension.find({where: [{Extension: extension},{TenantId: tenantId},{CompanyId:Company}], include: [{model: DbConn.SipUACEndpoint, as:'SipUACEndpoint', include: [{model: DbConn.CloudEndUser, as:'CloudEndUser'},{model: DbConn.UserGroup, as:'UserGroup', include: [{model: DbConn.Extension, as:'Extension'}]}]}]})
            .complete(function (err, extData)
            {
                callback(err, extData);
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


function ChangeUserAvailability(tenant,ext,st,reqId,callback) {


    try {
        DbConn.Extension.find({where: [{id: ext},{TenantId:tenant}]}).complete(function (errExt, ResExt) {

            if (errExt) {

                logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Error in searching ExtensionRefId %s of Tenant %s',reqId,ext,tenant,errExt);
                callback(errExt, undefined);
            }
            else
            {

                if (ResExt) {
                    logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s ',reqId,st,ext,tenant);
                    try {
                        ResExt.updateAttributes(
                            {
                                Enabled: st

                            }
                        ).then(function (resExUpdate) {

                                logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s is succeeded ',reqId,st,ext,tenant);
                                callback(undefined, resExUpdate);

                            }).error(function (errExUpdate) {

                                logger.error('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s is failed ',reqId,st,ext,tenant,errExUpdate);
                                callback(new Error("Error Found in updating"),undefined);

                            });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Exception in Updating status to %s of ExtensionRefId %s of Tenant %s ',reqId,st,ext,tenant,ex);
                        callback(ex, undefined);
                    }


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - No record found for Extension %s of Tenant %s ',reqId,ext,tenant);
                    callback(new Error("Error Occurred"), undefined);
                }
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Exception in searching Extension %s of Tenant %s ',reqId,ext,tenant,ex);
        callback(ex,undefined);
    }

}

function CreateExtension(reqExt,Company,Tenant,reqId,callback) {

    if(reqExt)
    {
        try {
            var obj = reqExt;

        }
        catch (ex) {
            callback(ex,undefined);
        }



        try {
            DbConn.Extension.find({where: [{Extension: obj.Extension}, {CompanyId: Company},{TenantId:Tenant}]}).complete(function (errExt, resExt) {

                if (err) {
                    logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,obj.Extension,errExt);
                    callback(errExt, undefined);
                }


                else
                {
                    if (!resExt) {


                        logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,obj.Extension);

                        SaveExtension(obj,Company,Tenant,reqId,function (resStstus) {
                            if (resStstus == 1) {

                                callback(undefined, resStstus);
                            }
                            else {

                                callback(new Error("Error in Extension Creation"), undefined);
                            }
                        });


                    }
                    else  {

                        logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s]   - Exception %s already In DB ',reqId,obj.Extension);
                        callback(new Error("Already in DataBase"), undefined);
                    }
                }

            });

        }
        catch (ex) {

            logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s]   - Exception in searching Extension %s ',reqId,obj.Extension);
            callback(ex,undefined);
        }

    }
    else
    {
        callback(new Error("Empty request"),undefined);
    }



}

function AssignToSipUser(Ext,UAC,Company,Tenant,reqId,callback) {

    try
    {
        DbConn.Extension.find({where: [{Extension: Ext},{CompanyId:Company},{TenantId:Tenant},{ObjType:'USER'}]}).complete(function (errExt, resExtObj) {


            if (errExt) {
                logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,errExt);
                callback(errExt, undefined);
            }


            else
            {

                if (!resExtObj ) {
                    logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);
                    callback(new Error("No Extension record found"), undefined);


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Record found for Extension %s and Searching for SipUser %s ',reqId,Ext,UAC);
                    try {
                        DbConn.SipUACEndpoint.find({where: [{id: UAC},{CompanyId:Company},{TenantId:Tenant}]}).complete(function (errSip, resSipObj) {

                            if (errSip) {
                                logger.error('[DVP-LimitHandler.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Error in searching SipUACEndpoint %s ',reqId,UAC,errSip);
                                callback(errSip, undefined);
                            }


                            else
                            {
                                if (!resSipObj) {
                                    logger.error('[DVP-LimitHandler.Extension.AssignToSipUser] - [%s] - [PGSQL]  - No record found for SipUACEndpoint %s ',reqId,UAC);

                                    callback(new Error("No SIPUser record found"), undefined);

                                }
                                else {
                                    logger.debug('[DVP-LimitHandler.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Record found for SipUACEndpoint %s ',reqId,UAC);
                                    /*
                                     try {
                                     DbConn.SipUACEndpoint.find({where: [{SipExtension: obj.SipExtension}]}).complete(function (errSip, resSip) {

                                     if (errSip) {
                                     logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Error in searching SipUACEndpoint Extension  %s ',reqId, obj.SipExtension,err);
                                     callback(errSip, undefined);
                                     }


                                     else

                                     {
                                     if (!resSip ) {

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
                                     ).then(function (resMap) {
                                     logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Mapping succeeded - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC);
                                     callback(undefined, resMap);

                                     }).error(function (errMap) {
                                     logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Mapping failed - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC,errMap);
                                     callback(errMap, undefined);

                                     });
                                     }
                                     catch (ex) {
                                     logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Exception in Mapping - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC,ex);
                                     callback(ex, undefined);
                                     }

                                     }
                                     else  {
                                     logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Record in already in DB - Data - ExtensionId %s SipExtension %s Of SipUACEndpoint %s ',reqId,ExtObject.id,obj.SipExtension,UAC);
                                     callback(new Error("Already in DB"),undefined);
                                     }

                                     }

                                     });
                                     }
                                     catch (ex) {
                                     logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtension] - [%s] - [PGSQL]  - Exception in searching SipUACEndpoints SipExtension %s ',reqId,obj.SipExtension,ex);
                                     callback(ex, undefined);
                                     }
                                     */
                                    resSipObj.setExtension(resExtObj).complete(function(errMap,resMap)
                                    {
                                        if(errMap)
                                        {
                                            callback(errMap,undefined);
                                        }
                                        else
                                        {
                                            callback(undefined,resMap);
                                        }
                                    });


                                }
                            }
                        });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Exception in searching SipUACEndpoints ID %s ',reqId,UAC,ex);
                        callback(ex, undefined);
                    }
                }
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Exception in searching Extension %s ',reqId,Ext,ex);
        callback(ex, undefined);
    }

}

function AssignToGroup(Ext,Grp,Company,Tenant,reqId,callback)
{

    try {
        DbConn.Extension.find({where: [{Extension: Ext},{CompanyId:Company},{TenantId:Tenant}]}).complete(function (errExt, resExtObject) {

            if (errExt) {
                logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Error in searching Extension - Extension %s Group % ',reqId,Ext,errExt);
                callback(errExt, undefined);
            }

            else
            {
                if (resExtObject) {
                    logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Extension found -  Data - %s',reqId,JSON.stringify(resExtObject));

                    try {
                        DbConn.UserGroup.find({where: [{id: Grp},{CompanyId:Company},{TenantId:Tenant}]}).complete(function (errGroup, resGroupObject) {
                            if (errGroup) {
                                logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Error in searching UserGroup %s ',reqId,Grp,errGroup);
                                callback(errz, undefined);
                            }

                            else if (resGroupObject!=null) {
                                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - UserGroup %s found.Mapping is starting ',reqId,Grp);

                                try {
                                    resGroupObject.setExtension(resExtObject).complete(function (errMap, resMap) {

                                        if (errMap) {
                                            logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Error in Mapping Extension %s with Group %s -  Data - %s',reqId,resExtObject.id,resGroupObject.id,errMap);
                                            callback(errMap, undefined)
                                        }
                                        else  {
                                            logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Mapping Extension %s with Group %s is succeeded -  Data - %s',reqId,resExtObject.id,resGroupObject.id);
                                            callback(undefined, resMap)
                                        }

                                    });
                                }
                                catch (ex) {
                                    logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Exception in Mapping Extension %s with Group %s -  Data - %s',reqId,resGroupObject.id,resExtObject.id);
                                    callback(ex, undefined);
                                }

                            }

                            else {
                                logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - No record found for group %s  ',reqId,Grp);
                                callback(new Error("No group record found"), undefined);
                            }

                        })

                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Exception in searching group %s  ',reqId,Grp,ex);
                        callback(ex, undefined);
                    }


                }
                else {
                    logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - No record found for Extension %s  ',reqId,Ext);
                    callback(err, sipObject);

                }
            }

        });



    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Exception in starting method : MapwithGroup  - Extension %s Group % ',reqId,Ext,Grp,ex);
        callback(ex,undefined);
    }
}

function SaveExtension(jobj,Company,Tenant,reqId,callback)
{
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
                CompanyId: Company,
                TenantId: Tenant,
                AddUser: jobj.AddUser,
                UpdateUser: jobj.UpdateUser



            }
        ).complete(function (errExt, resExt) {



                if (errExt ) {

                    logger.error('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [PGSQL]  -  Extension %s insertion failed ',reqId,jobj.Extension,errExt);
                    callback(0);



                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [PGSQL]  -  Extension %s insertion succeeded ',reqId,jobj.Extension);
                    callback(1);
                }
            });


    }
    catch (ex)
    {

        logger.error('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [PGSQL]  -  Exception in saving Extension %s ',reqId,jobj.Extension,ex);

        callback(ex,undefined);

    }

}

function PickExtensionUsers(Ext,Company,Tenant,reqId,callback)
{

    try {
        DbConn.Extension.find({where: [{Extension: Ext}, {TenantId: Tenant},{CompanyId:Company}],include: [{model: DbConn.SipUACEndpoint, as: "SipUACEndpoint"}]}).complete(function (errExtUser, resExtUser) {

            if (errExtUser) {
                logger.error('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,errExtUser);
                callback(errExtUser, undefined);
            }


            else
            {
                if (!resExtUser) {

                    logger.error('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);
                    callback(new Error("No extension found"),undefined);

                }

                else  {

                    logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - User records found for Extension %s ',reqId,Ext);
                    callback(undefined, resExtUser);
                }
            }

        });

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - Exception occurred  %s ',reqId,Ext);
        callback(ex,undefined);
    }

}

function PickCompanyExtensions(Company,Tenant,reqId,callback)
{
    try {
        DbConn.Extension.findAll({where: [{CompanyId: Company}, {TenantId: Tenant}]}).complete(function (errExt, resExt) {


            if (errExt) {
                logger.error('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - Error in searching Company %s ',reqId,Company,errExt);
                callback(errExt, undefined);
            }


            else
            {
                if (!resExt) {
                    logger.error('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - No record found for Company %s ',reqId,Company);
                    callback(new Error("No extension record found"), undefined);

                }



                else  {

                    logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - Extension records found for Company %s ',reqId,Company);
                    callback(undefined, resExt);
                }
            }

        });

    }
    catch (ex) {
        logger.error('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - Exception occurred  %s ',reqId,Company,ex);
        callback(ex,undefined);
    }

}

module.exports.ChangeUserAvailability = ChangeUserAvailability;
module.exports.CreateExtension = CreateExtension;
module.exports.AssignToSipUser = AssignToSipUser;
module.exports.AssignToGroup = AssignToGroup;
module.exports.PickExtensionUsers = PickExtensionUsers;
module.exports.PickCompanyExtensions = PickCompanyExtensions;
module.exports.GetUsersOfExtension = GetUsersOfExtension;
module.exports.AddDidNumberDB = AddDidNumberDB;
module.exports.SetDidNumberActiveStatusDB = SetDidNumberActiveStatusDB;
module.exports.DeleteDidNumberDB = DeleteDidNumberDB;
module.exports.GetDidNumbersForCompanyDB = GetDidNumbersForCompanyDB;
module.exports.AssignDidNumberToExtDB = AssignDidNumberToExtDB;
module.exports.SetDodNumberToExtDB = SetDodNumberToExtDB;
module.exports.AddEmergencyNumberDB = AddEmergencyNumberDB;
module.exports.DeleteEmergencyNumberDB = DeleteEmergencyNumberDB;
module.exports.GetEmergencyNumbersForCompany = GetEmergencyNumbersForCompany;