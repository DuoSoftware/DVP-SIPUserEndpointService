/**
 * Created by Administrator on 1/27/2015.
 */


var DbConn = require('DVP-DBModels');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;



function AddOrUpdateContext(req,reqId,callback) {

    if(req)
    {
        try {
            var ContextObj = req.body;

            ContextObj.CompanyId = 1;
            ContextObj.TenantId = 1;
            ContextObj.AddUser = "NAddUser";
            ContextObj.UpdateUser = "NUpdateUser";
            ContextObj.AddTime = new Date(2013, 01, 13);
            ContextObj.UpdateTime = new Date(2013, 01, 28);

        }
        catch (ex) {

            logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - Error occurred while Creating request Object ',reqId,ex);
            callback(ex,undefined);

        }




        if(ContextObj.Context) {
            try {
                DbConn.Context
                    .find({where: {Context: ContextObj.Context}})
                    .complete(function (errContext, resContext) {
                        if (errContext) {

                            logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Error occurred while searching Context %s ',reqId,ContextObj.Context,errContext);
                            callback(errContext, undefined);

                        }

                        else
                        {
                            if (!resContext) {

                                logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - No record found for Context %s ',reqId,ContextObj.Context);

                                try {

                                    logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Creating new record of Context %s ',reqId,ContextObj.Context);
                                    DbConn.Context
                                        .create(
                                        {
                                            Context: ContextObj.Context,
                                            Description: ContextObj.Description,
                                            ContextCat: ContextObj.ContextCat,
                                            ObjClass: "OBJCLZ",
                                            ObjType: "OBJTYP",
                                            ObjCategory: "OBJCAT",
                                            CompanyId: 1,
                                            TenantId: 1,
                                            AddUser: ContextObj.AddUser,
                                            UpdateUser: ContextObj.UpdateUser

                                        }
                                    ).complete(function (errSave, resSave) {

                                            if (errSave ) {

                                                logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Context %s insertion  failed - Data %s',reqId,ContextObj.Context,JSON.stringify(ContextObj),errSave);
                                                callback(errSave, undefined);



                                            }
                                            else {
                                                logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Context %s inserted successfully - Data %s',reqId,ContextObj.Context,JSON.stringify(ContextObj));
                                                callback(undefined, resSave);
                                            }
                                        });


                                }
                                catch (ex) {
                                    logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s]  - Exception in detail creation of Context %s',reqId,ContextObj.Context,ex);
                                    callback(ex, undefined);

                                }

                            } else {

                                logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s]  - Context found',reqId,JSON.stringify(resContext));

                                try {
                                    logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s]  - Updating picked Context data %s to %s',reqId,JSON.stringify(resContext),JSON.stringify(ContextObj));
                                    DbConn.Context
                                        .update(
                                        {
                                            Description: ContextObj.Description,
                                            ContextCat: ContextObj.ContextCat,
                                            ObjClass: "OBJCLZ",
                                            ObjType: "OBJTYP",
                                            ObjCategory: "OBJCAT",
                                            CompanyId: 1,
                                            TenantId: 1,
                                            AddUser: ContextObj.AddUser,
                                            UpdateUser: ContextObj.UpdateUser
                                        },
                                        {
                                            where: {
                                                Context: ContextObj.Context
                                            }
                                        }
                                    ).then(function (resUpdate) {


                                            logger.debug('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Context %s Updated successfully',reqId,ContextObj.Context);
                                            callback(undefined, resUpdate);

                                        }).error(function (errUpdate) {


                                            logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Context %s Updation failed',reqId,ContextObj.Context,errUpdate);
                                            callback(errUpdate, undefined);


                                        });
                                }
                                catch (ex) {
                                    logger.error('[DVP-SIPUserEndpointService.AddOrUpdateContext] - [%s] - [PGSQL] - Exception in updating context %s',reqId,ContextObj.Context,ex);
                                    callback(ex, undefined);
                                }

                            }

                        }
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

function  PickUserByUUID(reqId, uuid, companyId, tenantId, callback)
{
    try
    {
        DbConn.SipUACEndpoint.find({where: [{SipUserUuid: uuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (errSip, resSip)
            {
                if(errSip)
                {
                    logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                }
                else
                {
                    logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Query completed successfully',reqId);
                }
                callback(errSip, resSip);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - Method call failed ',reqId, ex);
        callback(ex, undefined);
    }
}


function GetCompanyContextDetails(CompanyId,reqId,callback)
{
    try {

        DbConn.Context
            .findAll({where: {CompanyId: CompanyId}})
            .complete(function (errContext, resContext) {

                if (errContext) {
                    logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - Error in searching Context %s ',reqId,CompanyId,err);
                    callback(errContext, undefined);

                } else
                {

                    if (!resContext) {

                        logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - No record found for Context %s ',reqId,CompanyId);
                        callback(new Error("No Context record found"), undefined);
                    }
                    else {




                        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL] - Record found for Context %s ',reqId,CompanyId);
                        callback(undefined, resContext);



                    }

                }
            });
    }
    catch (ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Exception in starting method : GetContextDetails  Context %s ',reqId,CompanyId);
        callback(ex,undefined);

    }

}



module.exports.AddOrUpdateContext = AddOrUpdateContext;
module.exports.GetCompanyContextDetails = GetCompanyContextDetails;
module.exports.PickUserByUUID = PickUserByUUID;

