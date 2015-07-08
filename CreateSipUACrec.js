/**
 * Created by pawan on 2/2/2015.
 */

var DbConn = require('DVP-DBModels');
var DbUpdate=require('./UpdateSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var nodeUuid = require('node-uuid');




function CreateUser(req,reqId,callback) {


    logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Searching for SipUACEndPoint %s ',reqId,SipObj.SipUsername);

    if(req.body)
    {
        try {
            var SipObj = req.body;


        }
        catch (ex) {

            logger.error('[DVP-SIPUserEndpointService.CreateUser] - error occurred while getting request body for SipUACEndPoint  ',reqId,req.body,errUser);
            callback(ex,undefined);
        }


        try {
            DbConn.SipUACEndpoint
                .find({where: [{SipUsername: SipObj.SipUsername}, {CompanyId: 1}, {TenantId: 1}]})
                .complete(function (errUser, resUser) {
                    if (errUser) {

                        logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - error occurred while searching for SipUACEndPoint %s ',reqId,SipObj.SipUsername,errUser);
                        callback(errUser,undefined);

                    } else if (resUser == null) {

                        logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - No record found for SipUACEndPoint %s ',reqId,SipObj.SipUsername);
                        try {



                            logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Saving new sip user %s',reqId,JSON.stringify(SipObj));

                            SaveUser(SipObj,reqId,function (error, st) {

                                if(error)
                                {
                                    callback(error,undefined);
                                }
                                else {

                                    if (st) {

                                        callback(undefined, st);
                                    }
                                    else
                                    {
                                        callback(new Error("Error returns"), undefined);
                                    }
                                }




                            });


                        }
                        catch (ex) {

                            logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Exception in saving UAC records',reqId,ex);
                            callback(ex,undefined);


                        }


                    } else {

                        logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - Found sip user %s',reqId,resUser.SipUsername);
                        callback(new Error("Cannot overwrite this record"),undefined);


                    }
                });

        }
        catch (ex) {
            logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - Exception in starting : SaveSip of %s',reqId,SipObj.SipUsername,ex);
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("Empty request"),undefined)
    }



}


function SaveUser(jobj,reqId,callback) {



    if (jobj) {

        logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s]  - Searching Records of CloudEndUser %s ',reqId,jobj.CloudEndUserId);
        try{
            DbConn.CloudEndUser.find({where: [{id: jobj.CloudEndUserId}]}).complete(function (errCloudObject, cloudEndObject) {

                if(errCloudObject)
                {
                    logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Error in Searching Records of CloudEndUser %s ',reqId,jobj.CloudEndUserId,errCloudObject);
                    callback(err,undefined);
                }
                else {

                    if (cloudEndObject) {

                        logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Record found for CloudEndUser %s and searching for Context %s',reqId,jobj.CloudEndUserId,jobj.Context);
                        DbConn.Context.find({where: [{Context: jobj.Context}]}).complete(function (errz, ContextObject) {

                            if (errz) {
                                logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Error in Searching Records of Context %s ',reqId,jobj.Context,errz);
                                callback(errz,undefined);
                            }
                            else
                            {
                                if (ContextObject) {

                                    var sipUserUuid = nodeUuid.v1();
                                    logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - Record found for Context %s and saving SipUser',reqId,jobj.Context);
                                    var SIPObject = DbConn.SipUACEndpoint
                                        .build(
                                        {
                                            SipUserUuid: sipUserUuid,
                                            SipUsername: jobj.SipUsername,
                                            Password: jobj.Password,
                                            Enabled: jobj.Enabled,
                                            ExtraData: jobj.ExtraData,
                                            EmailAddress: jobj.EmailAddress,
                                            GuRefId: jobj.GuRefId,
                                            CompanyId: 1,
                                            TenantId: 1,
                                            ObjClass: "OBJCLZ",
                                            ObjType: "OBJTYP",
                                            ObjCategory: "OBJCAT",
                                            AddUser: jobj.AddUser,
                                            UpdateUser: jobj.UpdateUser


                                        }
                                    );

                                    SIPObject.save().complete(function (errSave) {
                                        if (errSave) {
                                            logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Error in inserting Sip user records %s',reqId,JSON.stringify(jobj),errSave);
                                            callback(errSave, undefined);

                                        }
                                        else {

                                            logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - SipUser record added successfully',reqId);

                                            cloudEndObject.addSipUACEndpoint(SIPObject).complete(function (errCloud, CloudEndInstancex) {

                                                if(errCloud)
                                                {
                                                    logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Error in mapping cloud %s and SipUser %s',reqId,JSON.stringify(cloudEndObject),JSON.stringify(SIPObject),errCloud);
                                                    callback(new Error('Error in mapping CEU & SipUAC'),undefined);
                                                }
                                                else
                                                {
                                                    logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Successfully Mapping cloud %s and SipUser %s',reqId,JSON.stringify(cloudEndObject),JSON.stringify(SIPObject));
                                                    ContextObject.addSipUACEndpoint(SIPObject).complete(function (errContext, ContextInstancex) {

                                                        if(errContext)
                                                        {
                                                            logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Error in Mapping context %s and SipUser %s',reqId,JSON.stringify(ContextObject),JSON.stringify(SIPObject),errContext);
                                                            callback(new Error('Error in mapping Context & SipUAC'),undefined);
                                                        }
                                                        else
                                                        {
                                                            logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Successfully Mapping context %s and SipUser %s',reqId,JSON.stringify(ContextObject),JSON.stringify(SIPObject));
                                                            callback(undefined,ContextInstancex);
                                                        }



                                                    });
                                                }

                                            });
                                        }
                                    });
                                }
                                else  {
                                    logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - No record found for context %s',reqId,jobj.Context);
                                    callback(new Error("No context Found"),undefined);


                                }
                            }
                        });
                    }
                    else
                    {


                        logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - No record found for cloudEnduser %s',reqId,jobj.CloudEndUserId);
                        callback(new Error("No CloudEnduser found"),undefined);
                    }

                }

            });

        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Exception in searching cloudEnduser %s',reqId,jobj.CloudEndUserId,ex);
            callback(ex,undefined);

        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Invalid object received at the start : SaveUser %s',reqId,JSON.stringify(jobj),ex);
        callback(new Error("No object recieved "),undefined);
    }
}


module.exports.CreateUser = CreateUser;
