/**
 * Created by Administrator on 1/27/2015.
 */
//C:\DVP\DVP-SIPUsersEndpointService\DVP-Common\CSORMModels\CsDataModel.js

var DbConn = require('DVP-DBModels');
//var DbSave=require('./SaveSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;










//Post
//Request comes as body

//post :- done

function AddOrUpdateContext(reqz,reqId,callback) {
   // logger.info('Context Management is Starting.');


    try {
        var obj = reqz.body;

        obj.CompanyId = 1;
        obj.TenantId = 5;
        obj.AddUser = "NAddUser";
        obj.UpdateUser = "NUpdateUser";
        obj.AddTime = new Date(2013, 01, 13);
        obj.UpdateTime = new Date(2013, 01, 28);

    }
    catch (ex) {
        callback(ex,undefined);

    }




    if(obj.Context) {
        try {
            DbConn.Context
                .find({where: {Context: obj.Context}})
                .complete(function (err, result) {
                    if (err) {

                        logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Error occurred while searching Context %s ',reqId,obj.Context,err);
                        callback(err, undefined);

                    }

                    else
                    {
                        if (!result) {

                            logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - No record found for Context %s ',reqId,obj.Context);

                            try {

                                logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Creating new record of Context %s ',reqId,obj.Context);
                                DbConn.Context
                                    .create(
                                    {
                                        Context: obj.Context,
                                        Description: obj.Description,
                                        ContextCat: obj.ContextCat,
                                        ObjClass: "OBJCLZ",
                                        ObjType: "OBJTYP",
                                        ObjCategory: "OBJCAT",
                                        CompanyId: 1,
                                        TenantId: 1,
                                        AddUser: obj.AddUser,
                                        UpdateUser: obj.UpdateUser

                                    }
                                ).complete(function (err, user) {

                                        if (err ) {

                                            logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s insertion  failed - Data %s',reqId,obj.Context,JSON.stringify(obj),err);
                                            callback(err, undefined);



                                        }
                                        else {
                                            logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s inserted successfully - Data %s',reqId,obj.Context,JSON.stringify(obj));
                                            callback(undefined, user);
                                        }
                                    });


                            }
                            catch (ex) {
                                logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s]  - Exception in detail creation of Context %s',reqId,obj.Context,ex);
                                callback(ex, undefined);

                            }

                        } else {

                            logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s]  - Context found',reqId,JSON.stringify(result));

                            try {
                                logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s]  - Updating picked Context data %s to %s',reqId,JSON.stringify(result),JSON.stringify(obj));
                                DbConn.Context
                                    .update(
                                    {
                                        Description: obj.Description,
                                        ContextCat: obj.ContextCat,
                                        ObjClass: "OBJCLZ",
                                        ObjType: "OBJTYP",
                                        ObjCategory: "OBJCAT",
                                        CompanyId: 1,
                                        TenantId: 1,
                                        AddUser: obj.AddUser,
                                        UpdateUser: obj.UpdateUser
                                    },
                                    {
                                        where: {
                                            Context: obj.Context
                                        }
                                    }
                                ).then(function (results) {


                                        logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s Updated successfully',reqId,obj.Context);
                                        callback(undefined, results);

                                    }).error(function (err) {


                                        logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s Updation failed',reqId,obj.Context,err);
                                        callback(err, undefined);


                                    });
                            }
                            catch (ex) {
                                logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Exception in updating context %s',reqId,obj.Context,ex);
                                callback(ex, undefined);
                            }

                        }

                    }
                });

        }
        catch (ex) {
            logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Exception in Searching context %s',reqId,obj.Context,ex);
            callback(ex,undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Recieved Context id is invalid',reqId);
        callback(new Error("Invalid Context"),undefined);
    }
}

var GetSipUserDetailsByUuid = function(reqId, uuid, companyId, tenantId, callback)
{
    try
    {
        DbConn.SipUACEndpoint.find({where: [{SipUserUuid: uuid},{CompanyId: companyId},{TenantId: tenantId}]})
            .complete(function (errSip, resSip)
            {
                if(errSip)
                {
                    logger.error('[DVP-SIPUserEndpointService.GetSipUserDetailsByUuid] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                }
                else
                {
                    logger.debug('[DVP-SIPUserEndpointService.GetSipUserDetailsByUuid] - [%s] - [PGSQL] - Query completed successfully',reqId);
                }
                callback(errSip, resSip);
            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.GetSipUserDetailsByUuid] - [%s] - Method call failed ',reqId, ex);
        callback(ex, undefined);
    }
}

//get :- done
function GetContextDetails(reqz,reqId,callback)
{
    try {

        DbConn.Context
            // .find({ where: { Context: req.params.context } })
            .findAll({where: {CompanyId: reqz}})
            .complete(function (err, result) {

                if (err) {
                    //console.log('An error occurred while searching for Context:', err);
                    logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - Error in searching Context %s ',reqId,reqz,err);
                    //var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for Context for Company :" + reqz, false, result);
                    callback(err, undefined);

                } else
                {

                    if (!result) {

                        logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - No record found for Context %s ',reqId,reqz);
                        //var jsonString = messageFormatter.FormatMessage(err, "No context for company :" + reqz, true, result);
                        callback(new Error("No Context record found"), undefined);
                    }
                    else {

                        try {


                           // var Jresults = JSON.stringify(result);
console.log(result);
                            logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL] - Record found for Context %s ',reqId,reqz);
                            // var jsonString = messageFormatter.FormatMessage(err, "Successfully json returned", true, result);
                            callback(undefined, result);

                        }
                        catch (ex) {
                            //console.log("Error in creating json object to return : " + ex);
                           // logger.error('[DVP-LimitHandler.UACManagement.FindContextByCompany] - [%s] - [PGSQL]  - Exception in Record found for Context %s Data %s',reqId,reqz,Jresults);
                           // logger.debug('[DVP-LimitHandler.UACManagement.FindContextByCompany] - [%s] - [PGSQL]  - Record found for Context %s Data %s',reqId,reqz,Jresults);
                            //var jsonString = messageFormatter.FormatMessage(ex, "Exception found in json creating .", false, result);
                            callback(ex, undefined);
                        }

                        // set as Json Object

                    }

                }
            });
    }
    catch (ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [] - Exception in starting method : GetContextDetails  Context %s ',reqz);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception in calling function", false, null);
        callback(ex,undefined);

    }

}



module.exports.AddOrUpdateContext = AddOrUpdateContext;
module.exports.GetContextDetails = GetContextDetails;
module.exports.GetSipUserDetailsByUuid = GetSipUserDetailsByUuid;

