/**
 * Created by pawan on 2/20/2015.
 */

var DbConn = require('dvp-dbmodels');
var restify = require('restify');
var stringify=require('stringify');
var Sequelize=require('sequelize');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;


function CreateUserGroup(obj,reqId,callback)
{
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


                                /*complete(function (errGrpSave, resGrpSave) {
                                if (errGrpSave) {

                                    logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion failed - Group %s', reqId, JSON.stringify(obj), errGrpSave);
                                    callback(errGrpSave, undefined);

                                }
                                else {
                                    logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion succeeded - Group %s', reqId, JSON.stringify(obj));
                                    callback(undefined, resGrpSave);
                                }


                            });*/
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


                    /*complete(function (errGroup, resGroup) {

                    if (errGroup) {
                        logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s', reqId, obj.GroupName, errGroup);
                        callback(errGroup, undefined);
                    }
                    else {
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

                                UserGroupobj.save().complete(function (errGrpSave, resGrpSave) {
                                    if (errGrpSave) {

                                        logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion failed - Group %s', reqId, JSON.stringify(obj), errGrpSave);
                                        callback(errGrpSave, undefined);

                                    }
                                    else {
                                        logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion succeeded - Group %s', reqId, JSON.stringify(obj));
                                        callback(undefined, resGrpSave);
                                    }


                                });
                            }
                            catch (ex) {
                                logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Exception in New user group insertion  - Group %s', reqId, JSON.stringify(obj), ex);
                                callback(ex, undefined);
                            }
                        }
                    }


                });*/


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
//post :-done
function AssignUserToGroup(SID,GID,reqId,callback)
{

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
                            DbConn.UserGroup.find({where: [{id: GID}]}).complete(function (errGroup, resGroup) {
                                if (errGroup) {
                                    callback(errGroup, undefined);
                                }
                                else
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

                                                    /*complete(function (errx, groupInstancex) {

                                                    if (errx) {
                                                        callback(errx, undefined)
                                                    }
                                                    else  {
                                                        callback(undefined, groupInstancex)
                                                    }

                                                });*/
                                            }
                                            catch (ex) {
                                                callback(ex, undefined);
                                            }
                                        }
                                    }

                                }

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


                /*complete(function (errSip, resSip) {


                if (errSip) {
                    callback(errSip, undefined);
                }

                else
                {
                    if(!resSip)
                    {
                        callback(new Error("No SipUser Record Found"), undefined);
                    }
                    else
                    {


                        if(GID)
                        {
                            try {
                                DbConn.UserGroup.find({where: [{id: GID}]}).complete(function (errGroup, resGroup) {
                                    if (errGroup) {
                                        callback(errGroup, undefined);
                                    }
                                    else
                                    {
                                        if(!resGroup)
                                        {
                                            callback(new Error("No group record found"), undefined);
                                        }
                                        else
                                        {
                                            {
                                                try {
                                                    resGroup.addSipUACEndpoint(resSip).complete(function (errx, groupInstancex) {

                                                        if (errx) {
                                                            callback(errx, undefined)
                                                        }
                                                        else  {
                                                            callback(undefined, groupInstancex)
                                                        }

                                                    });
                                                }
                                                catch (ex) {
                                                    callback(ex, undefined);
                                                }
                                            }
                                        }




                                    }



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



                }

            });*/

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
//post :-post
function FillUsrGrp(obj,reqId,callback)
{
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


                                        //console.log('mapping group and sip done.................');



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
        logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Exception in starting method : FillUsrGrp  - Data %s',reqId,JSON.stringify(obj));
        callback(ex,undefined);
    }



}

function UpdateUserGroup(GID,obj,reqId,callback)
{
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



function PickUserGroup(GroupID,Company,Tenant,reqId,callback)
{
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




                /*.complete(function (errGrp, resGrp) {
                    if (errGrp) {
                        logger.error('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s ',reqId,GroupID,errGrp);
                        callback(errGrp, undefined);

                    } else
                    {
                        if (!resGrp) {

                            logger.error('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - No record found for Group %s ',reqId,GroupID);

                            callback(new Error("No group record found"), undefined);

                        } else {

                            logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupID);
                            callback(undefined, resGrp);

                        }
                    }

                });*/

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


function GetGroupEndpoints(obj,Company,Tenant,reqId,callback)
{
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


            /*.complete(function (err, result) {
                if (err) {
                    //console.log('An error occurred while searching for Extension:', err);
                    logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - Error in searching GroupEndpoints of CSDBUserGroupId %s ',reqId,obj,err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "Error in get group end point", false, null);
                    callback(err, undefined);

                } else
                {
                    if (!result) {
                        logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - No record found for GroupEndpoints of CSDBUserGroupId %s ',reqId,obj);
                        ///logger.info( 'No user found for the requirement. ' );
                        var jsonString = messageFormatter.FormatMessage(err, "No user found", false, null);
                        callback("No group record found", undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - Record found for GroupEndpoints of CSDBUserGroupId %s _ result %s',reqId,obj,JSON.stringify(result));
                        var jsonString = messageFormatter.FormatMessage(null, "Suceeded", true, result);
                        callback(undefined, result);

                        //console.log(result.Action)

                    }
                }

            });*/
    }
    catch(ex)
    {

        logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - Error in starting method :  GetGroupEndpoints',reqId,obj,ex);
        callback(ex, undefined);
    }
}


function PickUsersGroup(SipID,Company,Tenant,reqId,callback)
{
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

               /* complete(function (errSip, resSip) {

                    if (errSip) {
                        logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - Error in searching UsrGrp records of SipUACEndpoint %s ',reqId,SipID,errSip);
                        callback(errSip, undefined);

                    } else {
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
                    }

                });*/

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

//get :-done

function PickCompayGroups(Company,reqId,callback)
{
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
               /* .complete(function(errGroup, resGroup) {
                    if (errGroup) {

                        logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - Error in searching Group records of company %s ',reqId,Company,errGroup);
                        callback(errGroup, undefined);

                    } else
                    {
                        if (resGroup.length==0) {
                            logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - No Group records found for company %s ',reqId,Company);
                            callback(new Error("No group record found"), undefined);

                        } else {

                            logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - Records found for company %s ',reqId,Company);
                            callback(undefined, resGroup);

                        }
                    }
                });*/


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


function PickUsersInGroup(GroupId,Company,Tenant,reqId,callback)
{

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


                /*complete(function (errGroup, resGroup) {
                    if (errGroup) {
                        logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Error in searching Users of Group %s ',reqId,GroupId,errGroup);
                        callback(errGroup, undefined);

                    } else
                    {
                        if (!resGroup) {
                            logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - No User record found for Group %s ',reqId,GroupId);
                            callback(new Error("No group record found"), undefined);

                        } else {

                            logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupId);
                            callback(undefined, resGroup);

                        }
                    }

                });*/
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




//post funcs
module.exports.CreateUserGroup = CreateUserGroup;
module.exports.AssignUserToGroup = AssignUserToGroup;
module.exports.FillUsrGrp = FillUsrGrp;
module.exports.UpdateUserGroup = UpdateUserGroup;

//get funcs
module.exports.PickUserGroup = PickUserGroup;
module.exports.GetGroupEndpoints = GetGroupEndpoints;
module.exports.PickUsersGroup = PickUsersGroup;
module.exports.PickCompayGroups = PickCompayGroups;
module.exports.PickUsersInGroup = PickUsersInGroup;

