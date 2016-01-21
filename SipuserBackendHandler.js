/**
 * Created by Pawan on 11/9/2015.
 */
var DbConn = require('dvp-dbmodels');
var restify = require('restify');
var winston=require('winston');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var nodeUuid = require('node-uuid');


//Sipuser
function CreateUser(req,reqId,callback) {


    logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Searching for SipUACEndPoint %s ',reqId,req.SipUsername);

    if(req.body)
    {
        try {
            var SipObj = req.body;


        }
        catch (ex) {

            logger.error('[DVP-SIPUserEndpointService.CreateUser] - error occurred while getting request body for SipUACEndPoint  ',reqId,req.body,errUser);
            callback(ex,undefined);
        }

        if(SipObj.SipUsername)
        {

            try {
                DbConn.SipUACEndpoint
                    .find({where: [{SipUsername: SipObj.SipUsername}, {CompanyId: 1}, {TenantId: 1}]})
                    .then(function (resUser) {
                        if(!resUser)
                        {
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
                        }
                        else
                        {
                            logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - Found sip user %s',reqId,resUser.SipUsername);
                            callback(new Error("Cannot overwrite this record"),undefined);
                        }

                    }).catch(function (errUser) {
                        logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - error occurred while searching for SipUACEndPoint %s ',reqId,SipObj.SipUsername,errUser);
                        callback(errUser,undefined);
                    });




            }
            catch (ex) {
                logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - Exception in starting : SaveSip of %s',reqId,SipObj.SipUsername,ex);
                callback(ex,undefined);
            }
        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - SipUsername value is undefined ');
            callback(new Error("Undefined SipUsername"),undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - Empty request');
        callback(new Error("Empty request"),undefined)
    }



}


function SaveUser(jobj,reqId,callback) {



    if (jobj) {

        logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s]  - Searching Records of CloudEndUser %s ',reqId,jobj.CloudEndUserId);

        if(!isNaN(jobj.CloudEndUserId))
        {
            try{
                DbConn.CloudEndUser.find({where: [{id: jobj.CloudEndUserId}]}).then(function(resCloudUser)
                {
                    if (resCloudUser) {

                        logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Record found for CloudEndUser %s and searching for Context %s',reqId,jobj.CloudEndUserId,jobj.Context);


                        if(jobj.Context)
                        {
                            try
                            {
                                DbConn.Context.find({where: [{Context: jobj.Context}]}).then(function(resContext)
                                {
                                    if (resContext) {

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
                                                Pin:jobj.Pin,
                                                CompanyId: 1,
                                                TenantId: 1,
                                                ObjClass: "OBJCLZ",
                                                ObjType: "OBJTYP",
                                                ObjCategory: "OBJCAT",
                                                AddUser: jobj.AddUser,
                                                UpdateUser: jobj.UpdateUser,
                                                TransInternalEnable:jobj.TransInternalEnable,
                                                TransExternalEnable:jobj.TransExternalEnable,
                                                TransConferenceEnable:jobj.TransConferenceEnable,
                                                TransGroupEnable:jobj.TransGroupEnable


                                            }
                                        );

                                        SIPObject.save().then(function (resSave) {

                                            logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - SipUser record added successfully',reqId);

                                            resCloudUser.addSipUACEndpoint(SIPObject).then(function (resMapCldUser)
                                            {
                                                logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Successfully Mapping cloud %s and SipUser %s',reqId,JSON.stringify(resCloudUser),JSON.stringify(SIPObject));
                                                resContext.addSipUACEndpoint(SIPObject).then(function (resMapCntx)
                                                {

                                                    logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Successfully Mapping context %s and SipUser %s',reqId,JSON.stringify(resContext),JSON.stringify(SIPObject));
                                                    callback(undefined,resMapCntx);

                                                }).catch(function (errMapCntx) {
                                                    logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Error in Mapping context %s and SipUser %s',reqId,JSON.stringify(resContext),JSON.stringify(SIPObject),errMapCntx);
                                                    callback(new Error('Error in mapping Context & SipUAC'),undefined);
                                                });




                                            }).catch(function (errMapCldUser) {
                                                logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Error in mapping cloud %s and SipUser %s',reqId,JSON.stringify(resCloudUser),JSON.stringify(SIPObject),errMapCldUser);
                                                callback(new Error('Error in mapping CEU & SipUAC'),undefined);
                                            });






                                        }).catch(function (errSave) {
                                            logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] -Error in inserting Sip user records %s',reqId,JSON.stringify(jobj),errSave);
                                            callback(errSave, undefined);
                                        });


                                    }
                                    else  {
                                        logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - No record found for context %s',reqId,jobj.Context);
                                        callback(new Error("No context Found"),undefined);


                                    }
                                }).catch(function(errContext)
                                {
                                    logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Error in Searching Records of Context %s ',reqId,jobj.Context,errContext);
                                    callback(errContext,undefined);
                                });





                            }
                            catch(ex)
                            {
                                logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Exception in searching Context',ex);
                                callback(ex,undefined);
                            }
                        }
                        else
                        {
                            logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Context is Undefined');
                            callback(new Error("Context is Undefined"),undefined);
                        }


                    }
                    else
                    {


                        logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - No record found for cloudEnduser %s',reqId,jobj.CloudEndUserId);
                        callback(new Error("No CloudEnduser found"),undefined);
                    }
                }).catch(function(errCloudUser)
                {
                    logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Error in Searching Records of CloudEndUser %s ',reqId,jobj.CloudEndUserId,errCloudUser);
                    callback(err,undefined);
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
            logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - CloudEndUSerID is Undefined');
            callback(new Error("CloudEndUSerID is Undefined"),undefined);
        }

    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Invalid object received at the start : SaveUser %s',reqId,JSON.stringify(jobj),ex);
        callback(new Error("No request Object received "),undefined);
    }
}

function  PickUserByUUID(reqId, uuid, companyId, tenantId, callback) {
    logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Method Hit',reqId);
    if(uuid)
    {
        try
        {
            DbConn.SipUACEndpoint.find({where: [{SipUserUuid: uuid},{CompanyId: companyId},{TenantId: tenantId}]})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Query completed successfully',reqId);
                    callback(undefined, resSip);

                }).catch(function (errSip) {

                    logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                    callback(errSip, undefined);
                });



        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - Method call failed ',reqId, ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - UUID value Undefined ');
        callback(new Error("UUID value Undefined"), undefined);
    }

}

function  PickUserByName(Username,Company,Tenant,reqId, callback) {
    logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [PGSQL] - Method Hit',reqId);
    if(Username)
    {
        try
        {
            DbConn.SipUACEndpoint.find({where: [{SipUsername: Username},{CompanyId: Company},{TenantId: Tenant}],include:[{model: DbConn.Extension, as:'Extension'}]})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [PGSQL] - Query completed successfully',reqId);
                    callback(undefined, resSip);

                }).catch(function (errSip) {

                    logger.error('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                    callback(errSip, undefined);

                });



        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - Method call failed ',reqId, ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - Username value Undefined ');
        callback(new Error("Username value Undefined"), undefined);
    }

}

function  PickAllUsers(Company,Tenant,reqId, callback) {
    logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Method Hit',reqId);

        try
        {
            DbConn.SipUACEndpoint.findAll({where: [{CompanyId: Company},{TenantId: Tenant},{Enabled:"TRUE"}]})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Query completed successfully',reqId);
                    callback(undefined, resSip);

                }).catch(function (errSip) {

                    logger.error('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                    callback(errSip, undefined);

                });



        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - Method call failed ',reqId, ex);
            callback(ex, undefined);
        }



}


function UpdateUser(Username,jobj,reqId,callback) {

    if(Username && jobj)
    {
        delete jobj.SipUserUuid;
        delete jobj.CompanyId;
        delete jobj.TenantId;
console.log(JSON.stringify(jobj));
        try
        {
            DbConn.SipUACEndpoint
                .find({where: [{SipUsername: Username}, {CompanyId: 1}, {TenantId: 1}]})
                .then(function (resUser) {

                    if (!resUser) {

                        logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - No record found for SipUser %s ',reqId,Username);
                        callback(new Error("No SipUser record found"), undefined);

                    }
                    else {

                        try {

                            delete jobj.SipUsername;
                            delete jobj.SipUserUuid;
                            delete jobj.CompanyId;
                            delete jobj.TenantId;

                            resUser.updateAttributes(jobj).then(function (resUpdate) {

                                logger.debug('[DVP-LimitHandler.UACManagement.UpdateUser] - [%s] - [PGSQL]  - Updating records of SipUser %s is succeeded ',reqId,Username);
                                callback(undefined, resUpdate);

                            }).catch(function (errUpdate) {

                                console.log("Project update failed ! " + errUpdate);
                                logger.error('[DVP-LimitHandler.UACManagement.UpdateUser] - [%s] - [PGSQL]  - Updating records of SipUser %s is failed - Data %s ',reqId,Username,JSON.stringify(jobj),errUpdate);
                                callback(errUpdate, undefined);

                            });

                        }
                        catch (ex) {
                            logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - Exception in updating SipUser %s ',reqId,Username,ex);
                            callback(ex, undefined);
                        }
                    }

                }).catch(function (errUser) {
                    logger.error('[DVP-LimitSIPUserEndpointServiceHandler.UpdateUser] - [%s] - [PGSQL]  - Error in searching SipUser %s',reqId,Username,errUser);
                    callback(errUser, undefined);
                });
        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - Exception in Method starts : UpdateUser ',reqId,Username,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        callback(new Error("Empty request Or Undefined Username"),undefined);
    }


}

function UpdateUserStatus(Username,status,reqId,callback) {

    if(Username)
    {
        var SipObj= {
            Enabled:status
        };

        try
        {
            DbConn.SipUACEndpoint
                .find({where: [{SipUsername: Username}, {CompanyId: 1}, {TenantId: 1}]})
                .then(function (resUser) {

                    if (!resUser) {

                        logger.error('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - [PGSQL]  - No record found for SipUser %s ',reqId,Username);
                        callback(new Error("No SipUser record found"), undefined);

                    }
                    else {

                        try {


                            resUser.updateAttributes(SipObj).then(function (resUpdate) {

                                logger.debug('[DVP-LimitHandler.UACManagement.UpdateUserStatus] - [%s] - [PGSQL]  - Updating records of SipUser %s is succeeded ',reqId,Username);
                                callback(undefined, resUpdate);

                            }).catch(function (errUpdate) {

                                console.log("Project update failed ! " + errUpdate);
                                logger.error('[DVP-LimitHandler.UACManagement.UpdateUserStatus] - [%s] - [PGSQL]  - Updating records of SipUser %s is failed - Status %s ',reqId,Username,status,errUpdate);
                                callback(errUpdate, undefined);

                            });

                        }
                        catch (ex) {
                            logger.error('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - [PGSQL]  - Exception in updating SipUser %s ',reqId,Username,ex);
                            callback(ex, undefined);
                        }
                    }

                }).catch(function (errUser) {
                    logger.error('[DVP-LimitSIPUserEndpointServiceHandler.UpdateUserStatus] - [%s] - [PGSQL]  - Error in searching SipUser %s',reqId,Username,errUser);
                    callback(errUser, undefined);
                });
        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - [PGSQL]  - Exception in Method starts : UpdateUser ',reqId,Username,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        callback(new Error("Empty request Or Undefined Username"),undefined);
    }


}

function PickCompanyUsers(Company,reqId,callback) {

    if(!isNaN(Company)&& Company)
    {
        try
        {
            DbConn.SipUACEndpoint
                .findAll({where: {CompanyId: Company}})
                .then(function (resSip) {

                    if (resSip.length==0) {

                        logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - No record found for SipUser of Company %s ',reqId,Company);
                        callback(new Error("No SipUser record found For Company "+Company), undefined);
                    }
                    else {

                        logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Record found for Context %s ',reqId,Company);
                        callback(undefined, resSip);


                    }


                }).catch(function (errSip) {
                    logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Error in searching SipUser of Company %s ',reqId,Company,errSip);
                    callback(errSip, undefined);
                });

        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Exception in starting method:  ',reqId,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - GroupID is Undefined');
        callback(new Error(" GroupID is Undefined"), undefined);
    }

}



//Sipuser group
function CreateUserGroup(obj,reqId,callback) {
    if(obj)
    {
        if(obj.GroupName) {
            try {
                DbConn.UserGroup.find({where: [{GroupName: obj.GroupName}]}).then(function (resGroup) {

                    if (resGroup) {
                        logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Already in DB Group %s', reqId, obj.GroupName);
                        callback(new Error("Group is Alrady In DB"), undefined);
                    }
                    else {
                        try {

                            var UserGroupobj = DbConn.UserGroup
                                .build(
                                {

                                    GroupName: obj.GroupName,
                                    Domain: obj.Domain,
                                    ExtraData: obj.ExtraData,
                                    ObjClass: "OBJCLZ",
                                    ObjType: "OBJTYP",
                                    ObjCategory: "OBJCAT",
                                    CompanyId: 1,
                                    TenantId: 1


                                }
                            );

                            UserGroupobj.save().then(function (resGrpSave) {

                                logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion succeeded - Group %s', reqId, JSON.stringify(obj));
                                callback(undefined, resGrpSave);


                            }).catch(function (errGrpSave) {

                                logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion failed - Group %s', reqId, JSON.stringify(obj), errGrpSave);
                                callback(errGrpSave, undefined);

                            });



                        }
                        catch (ex) {
                            logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Exception in New user group insertion  - Group %s', reqId, JSON.stringify(obj), ex);
                            callback(ex, undefined);
                        }
                    }

                }).catch(function (errGroup) {

                    logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s', reqId, obj.GroupName, errGroup);
                    callback(errGroup, undefined);

                });





            }
            catch (ex) {
                logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Exception in user group Searching   - Group %s', reqId, JSON.stringify(obj), ex);
                callback(ex, undefined);
            }
        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  -  GroupName is Undefined');
            callback(new Error("GroupName is Undefined"), undefined);
        }
    }
    else
    {
        callback(new Error("Empty request"),undefined);
    }




}

function AssignUserToGroup(SID,GID,reqId,callback) {

    if(!isNaN(SID)&& SID &&!isNaN(GID)&& GID)
    {
        try {
            DbConn.SipUACEndpoint.find({where: [{id: SID}]}).then(function (resSip) {

                if(!resSip)
                {
                    callback(new Error("No SipUser Record Found"), undefined);
                }
                else
                {


                    if(GID)
                    {
                        try {
                            DbConn.UserGroup.find({where: [{id: GID}]}).then(function (resGroup)
                            {

                                    if(!resGroup)
                                    {
                                        callback(new Error("No group record found"), undefined);
                                    }
                                    else
                                    {
                                        {
                                            try {
                                                resGroup.addSipUACEndpoint(resSip).then(function (resMapGroup) {

                                                    callback(undefined, resMapGroup)

                                                }).catch(function (resMapGroup) {
                                                    callback(resMapGroup, undefined)
                                                });


                                            }
                                            catch (ex) {
                                                callback(ex, undefined);
                                            }
                                        }
                                    }

                            }).catch(function(err)
                            {
                                callback(err, undefined);
                            })

                        }
                        catch (ex) {
                            callback(ex, undefined);
                        }
                    }
                    else
                    {
                        callback(new Error("GroupID is Undefined"),undefined);
                    }


                }

            }).catch(function (errSip) {
                callback(errSip, undefined);
            });


        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("UserID or GroupId is Undefined"),undefined);
    }

}

function FillUserGroup(obj,reqId,callback) {
    try {
        DbConn.Extension.find({where: [{id: obj.ExtensionId}]}).complete(function (err, ExtObject) {

            if (err) {
                logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Error in searching Extension -  Data - %s',reqId,obj.ExtensionId,err);
                callback(err, undefined);
            }

            else
            {
                if (ExtObject) {
                    logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Extension found -  Data - %s',reqId,JSON.stringify(ExtObject));
                    console.log(ExtObject);

                    try {
                        DbConn.UserGroup.find({where: [{id: obj.GroupId}]}).complete(function (errz, groupObject) {
                            if (errz) {
                                logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Error in searching UserGroup %s ',reqId,obj.GroupId,errz);
                                callback(errz, undefined);
                            }

                            else if (groupObject) {
                                logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - UserGroup %s found.Mapping is strating ',reqId,obj.GroupId);

                                try {
                                    groupObject.addExtension(ExtObject).complete(function (errx, groupInstancex) {

                                        if (errx) {
                                            logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Error in Mapping Extension %s with Group %s -  Data - %s',reqId,ExtObject.id,groupObject.id,errx);
                                            callback(errx, undefined)
                                        }
                                        else  {
                                            logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Mapping Extension %s with Group %s is succeeded -  Data - %s',reqId,ExtObject.id,groupObject.id);
                                            callback(undefined, groupInstancex)
                                        }






                                    });
                                }
                                catch (ex) {
                                    logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Exception in Mapping Extension %s with Group %s -  Data - %s',reqId,ExtObject.id,groupObject.id);
                                    callback(ex, undefined);
                                }

                            }

                            else {
                                logger.error('[DVP-SIPUserEndpointService.SipUserGroupManagement.FillSipUserGroup] - [%s] - [PGSQL]  - No record found for group %s  ',reqId,obj.GroupId);
                                callback("No Group record found", undefined);
                            }

                        })

                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Exception in searching group %s  ',reqId,obj.GroupId,ex);
                        callback(ex, undefined);
                    }


                }
                else {
                    logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - No record found for Extension %s  ',reqId,obj.ExtensionId);
                    callback(err, sipObject);

                }
            }

        });



    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Exception in starting method : FillUserGroup  - Data %s',reqId,JSON.stringify(obj));
        callback(ex,undefined);
    }



}

function UpdateUserGroup(GID,obj,reqId,callback) {
    if(obj)
    {
        if(!isNaN(GID)&&GID)
        {
            try {
                DbConn.UserGroup
                    .update(
                    {
                        GroupName: obj.GroupName,
                        Domain: obj.Domain,
                        ExtraData: obj.ExtraData,
                        ObjClass: "OBJCLZ",
                        ObjType: "OBJTYP",
                        ObjCategory: "OBJCAT",
                        CompanyId: 1,
                        TenantId: 1


                    },
                    {
                        where: [{id: GID}]
                    }
                ).then(function (resGrpUpdate) {
                        logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Updation succeeded -  Data - %s',reqId,JSON.stringify(obj));

                        callback(undefined,resGrpUpdate);
                    }).catch(function (errGrpUpdate) {
                        logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Updation failed -  Data - %s',reqId,JSON.stringify(obj),err);
                        callback(errGrpUpdate,undefined);

                    });

            }
            catch(ex)
            {
                logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Exception in starting method : UpdateSipUserGroup  -  Data - %s',reqId,JSON.stringify(obj),ex);
                callback(ex,undefined);
            }
        }
        else
        {
            callback(new Error("GroupID is not in Correct format"),undefined);
        }

    }
    else
    {
        callback(new Error("Empty request"),undefined);
    }

}

function PickUserGroup(GroupID,Company,Tenant,reqId,callback) {
    if(!isNaN(GroupID)&& GroupID)
    {
        try {
            DbConn.UserGroup
                .find({
                    where: [{id: GroupID},{CompanyId:Company},{TenantId:Tenant}]
                }
            ).then(function (resGrp) {

                    if (!resGrp) {

                        logger.error('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - No record found for Group %s ',reqId,GroupID);

                        callback(new Error("No group record found"), undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupID);
                        callback(undefined, resGrp);

                    }

                }).catch(function (errGrp) {

                    logger.error('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s ',reqId,GroupID,errGrp);
                    callback(errGrp, undefined);
                });






        }
        catch(ex)
        {
            logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Exception in method starting : PickUserGroup ',reqId,GroupID,ex);
            callback(ex,undefined);
        }
    }
    else{
        logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - GroupId is Undefined ');
        callback(new Error("GroupId is Undefined"),undefined);
    }

}

function GetGroupEndpoints(obj,Company,Tenant,reqId,callback) {
    try {
        DbConn.UsrGrp
            .findAll({
                where: {CSDBUserGroupId: obj}
            }
        ).then(function (resUsrGrp) {

                if (!resUsrGrp) {
                    logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - No record found for GroupEndpoints of CSDBUserGroupId %s ',reqId,obj);
                    callback("No group record found", undefined);

                } else {

                    logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - Record found for GroupEndpoints of CSDBUserGroupId %s _ result %s',reqId,obj,JSON.stringify(resUsrGrp));
                    callback(undefined, resUsrGrp);


                }


            }).catch(function (errUsrGrp) {
                logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - Error in searching GroupEndpoints of CSDBUserGroupId %s ',reqId,obj,errUsrGrp);
                callback(errUsrGrp, undefined);
            });



    }
    catch(ex)
    {

        logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - Error in starting method :  GetGroupEndpoints',reqId,obj,ex);
        callback(ex, undefined);
    }
}

function PickUsersGroup(SipID,Company,Tenant,reqId,callback) {
    if(!isNaN(SipID)&& SipID)
    {
        try {

            DbConn.SipUACEndpoint.find({where: [{id: parseInt(SipID)},{CompanyId:Company},{TenantId:Tenant}], include: [{model: DbConn.UserGroup, as:"UserGroup"}],attributes:["id"]})
                .then(function (resSip) {

                    if (!resSip) {
                        logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - No records for SipUACEndpoint %s ',reqId,SipID);
                        callback(new Error("No group record found"), undefined);

                    } else {
                        logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - Records for SipUACEndpoint %s ',reqId,SipID);
                        if(resSip.UserGroup)
                        {
                            callback(undefined, resSip.UserGroup);
                        }
                        else
                        {
                            callback(new Error("user is not belongs to any group"),undefined);
                        }


                    }

                }).catch(function (errSip) {
                    logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - Error in searching UsrGrp records of SipUACEndpoint %s ',reqId,SipID,errSip);
                    callback(errSip, undefined);
                });



        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - Error in Method starting : EndpointGroupID  %S ',reqId,SipID,ex);
            callback(ex,undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - GroupId is Undefined ');
        callback(new Error("GroupId is not in correct format"),undefined);
    }


}

function PickCompayGroups(Company,reqId,callback) {
    if(!isNaN(Company)&&Company)
    {
        try{
            DbConn.UserGroup
                .findAll({where : {CompanyId:Company}
                }
            ).then(function(resGroup)
                {
                    if (resGroup.length==0) {
                        logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - No Group records found for company %s ',reqId,Company);
                        callback(new Error("No group record found"), undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - Records found for company %s ',reqId,Company);
                        callback(undefined, resGroup);

                    }
                }).catch(function (errGroup) {
                    logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - Error in searching Group records of company %s ',reqId,Company,errGroup);
                    callback(errGroup, undefined);
                });


        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - Exception on method starts : AllRecWithCompany - Data %s',reqId,Company,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] -  CompanyID is Undefined');
        callback(new Error("CompanyID is Undefined"), undefined);
    }

}

function PickUsersInGroup(GroupId,Company,Tenant,reqId,callback) {

    if(!isNaN(GroupId)&&GroupId)
    {
        try {
            DbConn.UserGroup.find({where: [{id: GroupId},{CompanyId:Company},{TenantId:Tenant}], include: [{model: DbConn.SipUACEndpoint , as: "SipUACEndpoint" }]})
                .then(function (resGroup) {

                    if (!resGroup) {
                        logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - No User record found for Group %s ',reqId,GroupId);
                        callback(new Error("No group record found"), undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupId);
                        callback(undefined, resGroup);

                    }

                }).catch(function (errGroup) {
                    logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Error in searching Users of Group %s ',reqId,GroupId,errGroup);
                    callback(errGroup, undefined);
                });

        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Exception occurred on start : GetAllUsersInGroup %s ',reqId,GroupId,ex);
            callback(ex, undefined);

        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - GroupID is Undefined');
        callback(new Error("GroupID is Undefined"), undefined);
    }


}



//Sipuser
module.exports.CreateUser = CreateUser;
module.exports.PickUserByUUID = PickUserByUUID;
module.exports.PickUserByName = PickUserByName;
module.exports.UpdateUser = UpdateUser;
module.exports.PickCompanyUsers = PickCompanyUsers;
module.exports.PickAllUsers = PickAllUsers;
module.exports.UpdateUserStatus = UpdateUserStatus;


//Sip user group

module.exports.CreateUserGroup = CreateUserGroup;
module.exports.AssignUserToGroup = AssignUserToGroup;
module.exports.FillUsrGrp = FillUserGroup;
module.exports.UpdateUserGroup = UpdateUserGroup;
//get funcs
module.exports.PickUserGroup = PickUserGroup;
module.exports.GetGroupEndpoints = GetGroupEndpoints;
module.exports.PickUsersGroup = PickUsersGroup;
module.exports.PickCompayGroups = PickCompayGroups;
module.exports.PickUsersInGroup = PickUsersInGroup;

