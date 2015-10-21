/**
 * Created by pawan on 2/6/2015.
 */

var DbConn = require('dvp-dbmodels');
var restify = require('restify');
var winston=require('winston');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;



var AddEmergencyNumberDB = function(reqId, emergencyNumInfo, callback)
{
    try
    {
        DbConn.EmergencyNumber.find({where: [{EmergencyNum: emergencyNumInfo.EmergencyNumber},{TenantId: emergencyNumInfo.TenantId}]})
            .then(function (numData)
            {
                if(numData)
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
                        .then(function (saveRes)
                        {

                                logger.debug('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - PGSQL query success', reqId);
                                callback(undefined, true, emerNum.id);


                        }).catch(function(err)
                        {
                            logger.error('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - PGSQL query failed', reqId, err);
                            callback(err, false, -1);
                        })
                }

            }).catch(function(err)
            {
                logger.error('[DVP-SIPUserEndpointService.AddEmergencyNumbersDB] - [%s] - Get Emergency Numbers PGSQL query failed', reqId, err);
                callback(err, false, -1);
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
        DbConn.EmergencyNumber.find({where: [{EmergencyNum: emergencyNum},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (eNumRec)
        {
            if(eNumRec)
            {
                eNumRec.destroy().then(function (result)
                {
                    logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query success', err);
                    callback(undefined, true);
                }).catch(function(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query failed', err);
                    callback(err, false);
                });
            }
            else
            {
                logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query success', reqId);
                callback(undefined, true);
            }

        }).catch(function(err)
        {
            logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query failed', reqId, err);
            callback(err, false);
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
            .then(function (eNumData)
            {

                    logger.debug('[DVP-SIPUserEndpointService.GetEmergencyNumbersForCompany] - [%s] - Get emergency numbers PGSQL query success', reqId);
                    callback(undefined, eNumData);


            }).catch(function(err)
            {
                logger.error('[DVP-SIPUserEndpointService.GetEmergencyNumbersForCompany] - [%s] - Get emergency numbers PGSQL query failed', reqId, err);
                callback(err, emptyArr);
            });
    }
    catch(ex)
    {
        callback(ex, emptyArr);
    }

};

var GetUsersOfExtension = function(reqId, extension, tenantId,Company,callback)
{

    if(extension)
    {
        try
        {
            DbConn.Extension.find({where: [{Extension: extension},{TenantId: tenantId},{CompanyId:Company}], include: [{model: DbConn.SipUACEndpoint, as:'SipUACEndpoint', include: [{model: DbConn.CloudEndUser, as:'CloudEndUser'},{model: DbConn.UserGroup, as:'UserGroup', include: [{model: DbConn.Extension, as:'Extension'}]}]}]})
                .then(function (resExt)
                {
                    callback(undefined, resExt);

                }).catch(function(err)
                {
                    callback(err, undefined);
                });

        }
        catch(ex)
        {
            callback(ex, false);
        }
    }
    else
    {
        callback(new Error("Extension is undefined "),undefined);
    }


};

var SetDodNumberToExtDB = function(reqId, dodNumber, extId, companyId, tenantId, isActive, callback)
{
    try
    {
        DbConn.Extension.find({where: [{TenantId: tenantId},{CompanyId: companyId},{id: extId}]}).then(function (ext)
        {
            if(ext)
            {
                logger.debug('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] - [%s] - Get Extension PGSQL query success', reqId);

                ext.updateAttributes({DodActive: isActive, DodNumber: dodNumber}).then(function (updtRes)
                {
                    logger.info('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] PGSQL Update Dod Number query success');
                    callback(undefined, true);

                }).catch(function(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] PGSQL Update Dod Number query failed', err);
                    callback(err, false);
                });

            }
            else
            {
                callback(new Error('Extension record not found'), false);
            }

        }).catch(function(err)
        {
            logger.error('[DVP-SIPUserEndpointService.SetDodNumberToExtDB] - [%s] - Get Extension PGSQL query failed', reqId, err);
            callback(err, false);
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
        DbConn.DidNumber.find({where: [{id: didNumId},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (didRec)
        {
            if(didRec)
            {
                didRec.destroy().then(function (result)
                {
                    logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query success');
                    callback(undefined, true);

                }).catch(function(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] PGSQL Delete did number query failed', err);
                    callback(err, false);
                });
            }
            else
            {
                logger.debug('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query success', reqId);
                callback(new Error('Did record not found'), false);
            }

        }).catch(function(err)
        {
            logger.error('[DVP-SIPUserEndpointService.DeleteDidNumberDB] - [%s] - PGSQL Get did number query failed', reqId, err);
            callback(err, false);
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
        DbConn.DidNumber.find({where: [{TenantId: didNumberInfo.TenantId},{DidNumber: didNumberInfo.DidNumber}]}).then(function (didRec)
        {
            if(didRec)
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
                    .then(function (saveRes)
                    {
                        logger.debug('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - PGSQL query success', reqId);
                        callback(undefined, true, didNum.id);


                    }).catch(function(err)
                    {
                        logger.error('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - PGSQL query failed', reqId, err);
                        callback(err, false, -1);
                    })
            }

        }).catch(function(err)
        {
            logger.error('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - Get Did Number PGSQL query failed', reqId, err);
            callback(err, false, -1);
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
            .then(function (didNumList)
            {
                logger.debug('[DVP-SIPUserEndpointService.GetDidNumbersForCompanyDB] - [%s] - PGSQL get did numbers for company query success', reqId);
                callback(undefined, didNumList);

            }).catch(function(err)
            {
                logger.error('[DVP-SIPUserEndpointService.GetDidNumbersForCompanyDB] - [%s] - PGSQL get did numbers for company query failed', reqId, err);
                callback(err, emptyArr);
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
            .then(function (extInf)
            {
                if(extInf)
                {
                    logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get Extension query success', reqId);

                    DbConn.DidNumber.find({where: [{id: didNumId},{CompanyId: companyId},{TenantId: tenantId}]})
                        .then(function (didNum)
                        {
                            if(didNum)
                            {
                                logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get didnumber query success', reqId);
                                didNum.setExtension(extInf).then(function (result)
                                {
                                    logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Update did number with extension query success', reqId);
                                    callback(undefined, true);

                                }).catch(function(err)
                                {
                                    logger.error('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Update did number with extension query failed', reqId, err);
                                    callback(err, false);
                                });
                            }
                            else
                            {
                                logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get did number query success', reqId);
                                logger.warn('DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - Extension not found', reqId);

                                callback(new Error('Extension not found'), false);
                            }
                        }).catch(function(err)
                        {
                            logger.error('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get did number query failed', reqId, err);
                            callback(err, false);
                        });
                }
                else
                {
                    logger.debug('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get Extension query success', reqId);
                    logger.warn('DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - Extension not found', reqId);

                    callback(new Error('Extension not found'), false);
                }
            }).catch(function(err)
            {
                logger.error('[DVP-SIPUserEndpointService.AssignDidNumberToExtDB] - [%s] - PGSQL Get Extension query failed', reqId, err);
                callback(err, false);
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
        DbConn.DidNumber.find({where: [{TenantId: tenantId},{CompanyId: companyId},{id: didNumId}]}).then(function (didRec)
        {
            if(didRec)
            {
                logger.debug('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] - [%s] - Get Did Number PGSQL query success', reqId);

                didRec.updateAttributes({DidActive: isActive.toString()}).then(function (upReslt)
                {
                    logger.info('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] PGSQL Update Did Status query success');
                    callback(undefined, true);


                }).catch(function(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] PGSQL Update Did Status query failed', err);
                    callback(err, false);
                });

            }
            else
            {
                callback(new Error('Did record not found'), false);
            }

        }).catch(function(err)
        {
            logger.error('[DVP-SIPUserEndpointService.SetDidNumberActiveStatusDB] - [%s] - Get Did Number PGSQL query failed', reqId, err);
            callback(err, false);
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
        DbConn.Extension.find({where: [{Extension: ext},{TenantId:tenant}]}).then(function (resExt)
        {
            if (resExt) {

                logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s ',reqId,st,ext,tenant);
                try {
                    resExt.updateAttributes(
                        {
                            Enabled: st

                        }
                    ).then(function (resUpdate) {

                            logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s is succeeded ',reqId,st,ext,tenant);
                            callback(undefined, resUpdate);

                        }).catch(function (errUpdate) {

                            logger.error('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s is failed ',reqId,st,ext,tenant,errUpdate);
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
        }).catch(function (errExt) {
            logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Error in searching ExtensionRefId %s of Tenant %s',reqId,ext,tenant,errExt);
            callback(errExt, undefined);
        });





        /* complete(function (errExt, resExt) {

         if (errExt) {

         logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Error in searching ExtensionRefId %s of Tenant %s',reqId,ext,tenant,errExt);
         callback(errExt, undefined);
         }
         else
         {

         if (resExt) {
         logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s ',reqId,st,ext,tenant);
         try {
         resExt.updateAttributes(
         {
         Enabled: st

         }
         ).then(function (resUpdate) {

         logger.debug('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s is succeeded ',reqId,st,ext,tenant);
         callback(undefined, resUpdate);

         }).error(function (errUpdate) {

         logger.error('[DVP-SIPUserEndpointService.ChangeUserAvailability] - [%s] - [PGSQL]  - Updating status to %s of ExtensionRefId %s of Tenant %s is failed ',reqId,st,ext,tenant,errUpdate);
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
         });*/
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


        if(obj.Extension)
        {
            try {
                DbConn.Extension.find({where: [{Extension: obj.Extension}, {CompanyId: Company},{TenantId:Tenant}]}).then(function (resExt)
                {

                    if (!resExt) {


                        logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,obj.Extension);

                        SaveExtension(obj,Company,Tenant,reqId,function (errStatus,resStatus) {
                            callback(errStatus,resStatus);
                        });


                    }
                    else  {

                        logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s]   - Exception %s already In DB ',reqId,obj.Extension);
                        callback(new Error("Already in DataBase"), undefined);
                    }



                }).catch(function (errExt)
                {
                    logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,obj.Extension,errExt);
                    callback(errExt, undefined);
                });




                /* complete(function (errExt, resExt) {

                 if (errExt) {
                 logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,obj.Extension,errExt);
                 callback(errExt, undefined);
                 }


                 else
                 {
                 if (!resExt) {


                 logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,obj.Extension);

                 SaveExtension(obj,Company,Tenant,reqId,function (errStatus,resStatus) {
                 callback(errStatus,resStatus);
                 });


                 }
                 else  {

                 logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s]   - Exception %s already In DB ',reqId,obj.Extension);
                 callback(new Error("Already in DataBase"), undefined);
                 }
                 }

                 });*/

            }
            catch (ex) {

                logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s]   - Exception in searching Extension %s ',reqId,obj.Extension);
                callback(ex,undefined);
            }
        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s]   - Extension value is Undefined',reqId);
            callback(new Error("Extension value is Undefined"),undefined);
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
        if(Ext && !isNaN(UAC) && UAC)
        {
            DbConn.Extension.find({where: [{Extension: Ext},{CompanyId:Company},{TenantId:Tenant},{ObjType:'USER'}]}).then(function (resExtObj)
            {

                if (!resExtObj ) {
                    logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);
                    callback(new Error("No Extension record found"), undefined);


                }
                else {
                    logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Record found for Extension %s and Searching for SipUser %s ',reqId,Ext,UAC);

                    if(UAC)
                    {


                        try {
                            DbConn.SipUACEndpoint.find({where: [{id: UAC}, {CompanyId: Company}, {TenantId: Tenant}]}).then(function (resSipObj)
                            {
                                if (!resSipObj) {
                                    logger.error('[DVP-LimitHandler.Extension.AssignToSipUser] - [%s] - [PGSQL]  - No record found for SipUACEndpoint %s ', reqId, UAC);

                                    callback(new Error("No SIPUser record found"), undefined);

                                }
                                else {
                                    logger.debug('[DVP-LimitHandler.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Record found for SipUACEndpoint %s ', reqId, UAC);

                                    resSipObj.setExtension(resExtObj).then(function (resMap)
                                    {



                                        resSipObj.updateAttributes({SipExtension: Ext}).then(function (resUpdate) {
                                            callback(undefined, resUpdate);

                                        }).catch(function (errUpdate) {
                                            callback(errUpdate, undefined);
                                        });



                                    }).catch(function (errMap)
                                    {
                                        callback(errMap, undefined);
                                    });




                                }
                            }).catch(function (errSip)
                            {
                                logger.error('[DVP-LimitHandler.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Error in searching SipUACEndpoint %s ', reqId, UAC, errSip);
                                callback(errSip, undefined);
                            });



                        }
                        catch (ex) {
                            logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Exception in searching SipUACEndpoints ID %s ', reqId, UAC, ex);
                            callback(ex, undefined);
                        }
                    }
                    else
                    {
                        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - SipUser id Undefined');
                        callback(new Error("SipUserID is Undefined"), undefined);
                    }
                }


            }).catch(function (errExt)
            {

                logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,errExt);
                callback(errExt, undefined);


            });





        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.Extension.AssignToSipUser] - [%s] - [PGSQL]  - Extension is Undefined or User ID is Not in correct Format  ',reqId);
            callback(new Error("Extension is Undefined or User ID is Not in correct Format"), undefined);
        }

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
        if(Ext && !isNaN(Grp)&& Grp)
        {
            DbConn.Extension.find({where: [{Extension: Ext},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resExtObject)
            {
                if (resExtObject) {
                    logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Extension found -  Data - %s',reqId,JSON.stringify(resExtObject));

                    try {
                        DbConn.UserGroup.find({where: [{id: Grp},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resGroupObject)
                        {
                            if(resGroupObject)
                            {
                                logger.debug('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - UserGroup %s found.Mapping is starting ',reqId,Grp);

                                try {
                                    resGroupObject.setExtension(resExtObject).then(function (resMap)
                                    {
                                        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Mapping Extension %s with Group %s is succeeded -  Data - %s',reqId,resExtObject.id,resGroupObject.id);
                                        callback(undefined, resMap);

                                    }).catch(function (errMap) {

                                        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Error in Mapping Extension %s with Group %s -  Data - %s',reqId,resExtObject.id,resGroupObject.id,errMap);
                                        callback(errMap, undefined);

                                    });


                                }
                                catch (ex) {
                                    logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Exception in Mapping Extension %s with Group %s -  Data - %s',reqId,resGroupObject.id,resExtObject.id);
                                    callback(ex, undefined);
                                }
                            }
                            else
                            {
                                logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - No record found for group %s  ',reqId,Grp);
                                callback(new Error("No group record found"), undefined);
                            }
                        }).catch(function (errGroup)
                        {
                            logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Error in searching UserGroup %s ',reqId,Grp,errGroup);
                            callback(errz, undefined);
                        });






                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Exception in searching group %s  ',reqId,Grp,ex);
                        callback(ex, undefined);
                    }


                }
                else
                {
                    logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - No record found for Extension %s  ',reqId,Ext);
                    callback(new Error('No record found for Extension'), undefined);

                }
            }).catch(function (errExt)
            {
                logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s] - [PGSQL]  - Error in searching Extension - Extension %s Group % ',reqId,Ext,errExt);
                callback(errExt, undefined);
            });





        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.Extension.AssignToGroup] - [%s]  - Exception in Undefined or Group ID is not in correct format ',reqId);
            callback(new Error("Exception in Undefined or Group ID is not in correct format"),undefined);
        }




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
                ObjCategory: jobj.ObjCategory,
                CompanyId: Company,
                TenantId: Tenant,
                AddUser: jobj.AddUser,
                UpdateUser: jobj.UpdateUser



            }
        ).then(function (resExt)
            {
                logger.debug('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [PGSQL]  -  Extension %s insertion succeeded ',reqId,jobj.Extension);
                callback(undefined,resExt);

            }).catch(function (errExt)
            {
                logger.error('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [PGSQL]  -  Extension %s insertion failed ',reqId,jobj.Extension,errExt);
                callback(errExt,undefined);
            });





    }
    catch (ex)
    {

        logger.error('[DVP-SIPUserEndpointService.CreateExtension] - [%s] - [PGSQL]  -  Exception in saving Extension %s ',reqId,jobj.Extension,ex);

        callback(ex,undefined);

    }

}

function PickExtensionUser(Ext,Company,Tenant,reqId,callback)
{

    if(Ext)
    {
        try {
            DbConn.Extension.find({where: [{Extension: Ext}, {TenantId: Tenant},{CompanyId:Company}],include: [{model: DbConn.SipUACEndpoint, as: "SipUACEndpoint"}]}).then(function (resExtUser)
            {

                if(resExtUser)  {

                    logger.debug('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - User records found for Extension %s ',reqId,Ext);
                    callback(undefined, resExtUser);
                }
                else
                {


                    logger.error('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - No record found for Extension %s ',reqId,Ext);
                    callback(new Error("No extension found"),undefined);


                }


            }).catch(function (errExtUser)
            {
                logger.error('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - Error in searching Extension %s ',reqId,Ext,errExtUser);
                callback(errExtUser, undefined);
            });




        }
        catch (ex) {
            logger.error('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] - [PGSQL]  - Exception occurred  %s ',reqId,Ext);
            callback(ex,undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickExtensionUsers] - [%s] Extension is Undefined');
        callback(new Error("Extension is Undefined"),undefined);
    }


}

function PickCompanyExtensions(Company,Tenant,reqId,callback)
{
    if(!isNaN(Company) && Company)
    {
        try {
            DbConn.Extension.findAll({where: [{CompanyId: Company}, {TenantId: Tenant}]}).then(function (resExt)
            {

                if (resExt.length==0) {
                    logger.error('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - No record found for Company %s ',reqId,Company);
                    callback(new Error("No extension record found for Company "+Company), undefined);

                }



                else  {

                    logger.debug('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - Extension records found for Company %s ',reqId,Company);
                    callback(undefined, resExt);
                }



            }).catch(function (errExt)
            {

                logger.error('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - Error in searching Company %s ',reqId,Company,errExt);
                callback(errExt, undefined);

            });




        }
        catch (ex) {
            logger.error('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - [PGSQL]  - Exception occurred  %s ',reqId,Company,ex);
            callback(ex,undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickCompanyExtensions] - [%s] - CompanyID is Undefined');
        callback(new Error("CompanyID is Undefined"),undefined);
    }



}

module.exports.ChangeUserAvailability = ChangeUserAvailability;
module.exports.CreateExtension = CreateExtension;
module.exports.AssignToSipUser = AssignToSipUser;
module.exports.AssignToGroup = AssignToGroup;
module.exports.PickExtensionUser = PickExtensionUser;
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