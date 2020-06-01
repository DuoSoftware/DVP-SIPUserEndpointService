/**
 * Created by Pawan on 11/9/2015.
 */

var logger = require('dvp-common-lite/LogHandler/CommonLogHandler.js').logger;
var DbConn = require('dvp-dbmodels');
var redisCacheHandler = require('dvp-common/CSConfigRedisCaching/RedisHandler.js');
var Promise = require('bluebird');


function AddOrUpdateContext(company, tenant, ctxt, reqId, callback)
{
    logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Method Hit',reqId);
    if(ctxt)
    {
        if(ctxt.Context)
        {
            try
            {
                DbConn.Context
                    .find({where: {Context: ctxt.Context}})
                    .then(function (resContext)
                    {

                        if (!resContext)
                        {

                            try
                            {
                                var recEnabled = false;

                                if(ctxt.RecordingEnabled === true || ctxt.RecordingEnabled === false)
                                {
                                    recEnabled = ctxt.RecordingEnabled;
                                }

                                logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Creating new record of Context %s ',reqId, ctxt.Context);
                                DbConn.Context
                                    .create(
                                    {
                                        Context: ctxt.Context,
                                        Description: ctxt.Description,
                                        ContextCat: ctxt.ContextCat,
                                        ObjClass: ctxt.ObjClass,
                                        ObjType: ctxt.ObjClass,
                                        ObjCategory: ctxt.ObjCategory,
                                        CompanyId: company,
                                        TenantId: tenant,
                                        RecordingEnabled: recEnabled

                                    }
                                ).then(function (resSave)
                                    {

                                        if(resSave)
                                        {
                                            redisCacheHandler.addContextToCache(resSave.Context, resSave);
                                        }

                                        logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Context %s inserted successfully - Data %s',reqId, ctxt.Context,JSON.stringify(ctxt));
                                        callback(undefined, resSave);

                                    }).catch(function (errSave)
                                    {

                                        logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Context %s insertion  failed - Data %s',reqId, ctxt.Context,JSON.stringify(ctxt), errSave);
                                        callback(errSave, undefined);

                                    });





                            }
                            catch (ex)
                            {
                                logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s]  - Exception in detail creation of Context %s', reqId, ctxt.Context, ex);
                                callback(ex, undefined);

                            }

                        }
                        else
                        {

                            logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s]  - Context found', reqId, JSON.stringify(resContext));

                            callback(new Error("Cannot override data"),undefined);

                        }

                    }).catch(function (errContext) {

                        logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Error occurred while searching Context %s ',reqId,ContextObj.Context,errContext);
                        callback(errContext, undefined);

                    });




            }
            catch (ex) {
                logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Exception in Searching context %s',reqId,ContextObj.Context,ex);
                callback(ex,undefined);
            }
        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Recieved Context id is invalid',reqId);
            callback(new Error("Invalid Context"),undefined);
        }
    }
    else
    {
        callback(new Error("Empty request"),undefined);
    }

}

function GetCompanyContextDetails(CompanyId,Tenant,reqId,callback)
{
    if(!isNaN(CompanyId)&& CompanyId)
    {
        try {

            DbConn.Context
                .findAll({where: [{CompanyId: CompanyId},{TenantId:Tenant}]})
                .then(function (resContext) {

                        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL] - %s Records found for Context %s ',reqId,resContext.length,CompanyId);
                        callback(undefined, resContext);


                }).catch(function (errContext) {

                    logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - Error in searching Context %s ',reqId,CompanyId,errContext);
                    callback(errContext, undefined);

                });


        }
        catch (ex)
        {
            logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Exception in starting method : GetContextDetails  Context %s ',reqId,CompanyId);
            callback(ex,undefined);

        }
    }
    else
    {
        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - CompanyID is Undefined');
        callback(new Error("CompanyID is Undefined"),undefined);
    }


}


function PickAllContexts(Company,Tenant,reqId,callback)
{
    DbConn.Context
        .findAll({where:[{CompanyId:Company},{TenantId:Tenant}]})
        .then(function (resContext) {


            logger.debug('[DVP-SIPUserEndpointService.PickAllContexts] - [%s]  - Context records found',reqId);
            callback(undefined,resContext);


        }).catch(function (errContext) {

            logger.error('[DVP-SIPUserEndpointService.PickAllContexts] - [%s] - [PGSQL] - Error occurred while searching Contexts',reqId,errContext);
            callback(errContext, undefined);

        });
}


function UpdateContext(company,tenant,context,contextObj,reqId,callback)
{
    logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - [PGSQL] - Method Hit',reqId);

    if(contextObj)
    {
        delete contextObj.Context;
        delete contextObj.CompanyId;
        delete contextObj.TenantId;

        if(contextObj.RecordingEnabled !== true && contextObj.RecordingEnabled !== false)
        {
            contextObj.RecordingEnabled = false;
        }

        DbConn.Context
            .find({where: [{Context: context},{CompanyId:company},{TenantId:tenant}]})
            .then(function (resContext)
            {
                if(resContext)
                {
                    logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s]  - Context records found %s',reqId,context);
                    resContext.updateAttributes(contextObj).then(function (resUpdate)
                    {

                        if(resUpdate)
                        {
                            redisCacheHandler.addContextToCache(resUpdate.Context, resUpdate);
                        }

                        logger.debug('[DVP-SIPUserEndpointService.UpdateContext] - [%s]  - Context records updated',reqId);
                        callback(undefined,resUpdate);

                    }).catch(function (errUpdate)
                    {
                        logger.error('[DVP-SIPUserEndpointService.UpdateContext] - [%s]  - Context records updation Error',reqId,errUpdate);
                        callback(errUpdate,undefined);
                    })
                }
                else
                {
                    callback(new Error('Context not found'), null);
                }




            }).catch(function (errContext)
            {
                logger.error('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - [PGSQL] - Error occurred while searching Contexts %s ',reqId,context,errContext);
                callback(errContext,undefined);
            })
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateContext] - [%s] - [PGSQL] - Body not found Contexts %s ',reqId,context);
        callback(new Error("Empty Body found"),undefined);
    }

}

function PickContext(company,tenant,context,reqId,callback)
{
    DbConn.Context
        .find({where:[{CompanyId:company},{TenantId:tenant},{Context:context}]})
        .then(function (resContext) {



            logger.debug('[DVP-SIPUserEndpointService.PickContext] - [%s]  - Context records found',reqId);
            callback(undefined,resContext);


        }).catch(function (errContext) {

            logger.error('[DVP-SIPUserEndpointService.PickContext] - [%s] - [PGSQL] - Error occurred while searching Contexts %s ',reqId,errContext);
            callback(errContext, undefined);

        });
}

function DeleteContext(company,tenant,context,reqId,callback)
{
    DbConn.Context
        .find({where:[{CompanyId:company},{TenantId:tenant},{Context:context}]})
        .then(function (resContext) {



            logger.debug('[DVP-SIPUserEndpointService.DeleteContext] - [%s]  - Context records found',reqId);
            resContext.destroy().then(function (resDel)
            {
                redisCacheHandler.removeContextFromCache(context);
                logger.debug('[DVP-SIPUserEndpointService.DeleteContext] - [%s]  - Context deleted successfully',reqId);
                callback(undefined,resDel);
            }).catch(function (errDel)
            {
                logger.error('[DVP-SIPUserEndpointService.DeleteContext] - [%s]  - Context deletion error',reqId,errDel);
                callback(errDel,undefined);
            })



        }).catch(function (errContext) {

            logger.error('[DVP-SIPUserEndpointService.PickContext] - [%s] - [PGSQL] - Error occurred while searching Contexts %s ',reqId,errContext);
            callback(errContext, undefined);

        });
}

var AddContextCodecPrefs = function(reqId, context1, context2, codecPreferences, companyId, tenantId)
{
    return new Promise(function(fulfill, reject)
    {
        try
        {

            DbConn.ContextCodecPref.find({where: [{TenantId: tenantId, CompanyId: companyId, Context1: context1, Context2: context2}]}).then(function (contextPrefs)
            {
                if(contextPrefs)
                {
                    reject(new Error('Theres an exsisting codec configuration'));
                }
                else
                {
                    //save ok
                    var codecPref = DbConn.ContextCodecPref.build({

                        Context1: context1,
                        Context2: context2,
                        CompanyId: companyId,
                        TenantId: tenantId,
                        Codecs: JSON.stringify(codecPreferences)
                    });

                    codecPref.save().then(function (saveRes)
                    {
                        fulfill(saveRes);

                    }).catch(function(err)
                    {
                        reject(err);
                    })
                }

            }).catch(function(err)
            {
                reject(err);
            });


        }
        catch(ex)
        {
            reject(ex);
        }
    });

};

var UpdateContextCodecPrefs = function(reqId, context1, context2, codecPreferences, companyId, tenantId)
{
    return new Promise(function(fulfill, reject)
    {
        try
        {

            DbConn.ContextCodecPref.find({where: [{TenantId: tenantId, CompanyId: companyId, Context1: context1, Context2: context2}]}).then(function (contextPrefs)
            {
                if(contextPrefs)
                {
                    contextPrefs.updateAttributes({Codecs: JSON.stringify(codecPreferences)}).then(function (resUpdate)
                    {
                        fulfill(resUpdate);

                    }).catch(function (err)
                    {
                        reject(err);
                    })
                }
                else
                {
                    reject(new Error('No records found to update'));
                }

            }).catch(function(err)
            {
                reject(err);
            });


        }
        catch(ex)
        {
            reject(ex);
        }
    });

};

var RemoveContextCodecPrefs = function(reqId, prefId, companyId, tenantId)
{
    return new Promise(function(fulfill, reject)
    {
        try
        {

            DbConn.ContextCodecPref.find({where: [{id: prefId, TenantId: tenantId, CompanyId: companyId}]}).then(function (contextPrefs)
            {
                if(contextPrefs)
                {

                    contextPrefs.destroy().then(function (delRes)
                    {
                        fulfill(true);

                    }).catch(function (err)
                    {
                        reject(err);
                    })
                }
                else
                {
                    //save ok
                    reject(new Error('No context preference found'));
                }

            }).catch(function(err)
            {
                reject(err);
            });


        }
        catch(ex)
        {
            reject(ex);
        }
    });

};

var GetContextCodecPrefs = function(reqId, companyId, tenantId)
{
    return new Promise(function(fulfill, reject)
    {
        try
        {

            DbConn.ContextCodecPref.findAll({where: [{TenantId: tenantId, CompanyId: companyId}]}).then(function (contextPrefs)
            {
                var newContextPrefs = contextPrefs.map(function(item)
                {
                    item.Codecs = JSON.parse(item.Codecs);
                    return item;
                });

                fulfill(newContextPrefs);

            }).catch(function(err)
            {
                reject(err);
            });


        }
        catch(ex)
        {
            reject(ex);
        }
    });

};

var GetContextCodecPrefsByContext = function(reqId, contextIn, extension, companyId, tenantId)
{
    return new Promise(function(fulfill, reject)
    {
        try
        {
            DbConn.Extension.find({where: [{TenantId: tenantId, CompanyId: companyId, Extension: extension}], include:[{model: DbConn.SipUACEndpoint, as: "SipUACEndpoint"}]}).then(function (extInfo)
            {
                if(extInfo && extInfo.SipUACEndpoint && extInfo.SipUACEndpoint.ContextId)
                {
                    var tempArr = [];
                    tempArr.push(contextIn, extInfo.SipUACEndpoint.ContextId);

                    var sortedArr = tempArr.sort();
                    DbConn.ContextCodecPref.find({where :[{Context1: sortedArr[0], Context2: sortedArr[1], CompanyId: companyId, TenantId: tenantId}]}).then(function (contextPrefs)
                    {
                        var newContextPrefs = JSON.parse(contextPrefs.Codecs);

                        fulfill(newContextPrefs);

                    }).catch(function(err)
                    {
                        reject(err);
                    });
                }
                else
                {
                    reject(new Error('No user found for the extension or context not set'));
                }

            }).catch(function(err)
            {
                reject(err);
            });




        }
        catch(ex)
        {
            reject(ex);
        }
    });

};

module.exports.AddOrUpdateContext = AddOrUpdateContext;
module.exports.GetCompanyContextDetails = GetCompanyContextDetails;
module.exports.PickAllContexts = PickAllContexts;
module.exports.UpdateContext = UpdateContext;
module.exports.PickContext = PickContext;
module.exports.DeleteContext = DeleteContext;
module.exports.AddContextCodecPrefs = AddContextCodecPrefs;
module.exports.RemoveContextCodecPrefs = RemoveContextCodecPrefs;
module.exports.GetContextCodecPrefs = GetContextCodecPrefs;
module.exports.UpdateContextCodecPrefs = UpdateContextCodecPrefs;
module.exports.GetContextCodecPrefsByContext = GetContextCodecPrefsByContext;