/**
 * Created by pawan on 2/20/2015.
 */

var DbConn = require('DVP-DBModels');
var restify = require('restify');
var stringify=require('stringify');
var Sequelize=require('sequelize');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;


function CreateUserGroup(obj,reqId,callback)
{
    try {
        DbConn.UserGroup.find({where: [{GroupName: obj.GroupName}]}).complete(function (errGroup, resGroup) {

            if (errGroup) {
                logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s',reqId,obj.GroupName,errGroup);
                callback(errGroup, undefined);
            }
            else
            {
                if (resGroup) {
                    logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Already in DB Group %s',reqId,obj.GroupName);
                    callback(undefined, resGroup);
                }
                else  {
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

                                logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - New user group insertion failed - Group %s',reqId,JSON.stringify(obj),errGrpSave);
                                callback(errGrpSave, undefined);

                            }
                            else {
                                logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - New user group insertion succeeded - Group %s',reqId,JSON.stringify(obj));
                                callback(undefined, result);
                            }


                        });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Exception in New user group insertion  - Group %s',reqId,JSON.stringify(obj),ex);
                        callback(ex, undefined);
                    }
                }
            }


        });


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Exception in user group Searching   - Group %s',reqId,JSON.stringify(obj),ex);
        callback(ex,undefined);
    }


}
//post :-done
function MapExtensionID(obj,callback)
{


    try {
        DbConn.SipUACEndpoint.find({where: [{id: obj.ExtensionId}]}).complete(function (err, sipObject) {


            if (err) {
                callback(err, undefined);
            }

            else
            {
                if (sipObject) {
                    console.log(sipObject);

                    try {
                        DbConn.UserGroup.find({where: [{id: obj.GroupId}]}).complete(function (errz, groupObject) {
                            if (errz) {
                                callback(errz, undefined);
                            }

                            else if (groupObject) {
                                //console.log(groupObject);

                                try {
                                    groupObject.addSipUACEndpoint(sipObject).complete(function (errx, groupInstancex) {

                                        if (errx) {
                                            callback(errx, undefined)
                                        }
                                        else  {
                                            callback(undefined, groupInstancex)
                                        }


                                        //console.log('mapping group and sip done.................');



                                    });
                                }
                                catch (ex) {
                                    callback(ex, undefined);
                                }

                            }

                            else {
                                callback("No group record found", undefined);
                            }

                        })

                    }
                    catch (ex) {
                        callback(ex, undefined);
                    }


                }
                else {

                    callback(err, sipObject);

                }
            }

        });



    }
    catch(ex)
    {
        callback(ex,undefined);
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
            }).error(function (errGrpUpdate) {
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



function PickUserGroup(GroupID,Company,Tenant,reqId,callback)
{
    try {
        DbConn.UserGroup
            .findAll({
                where: [{id: GroupID},{CompanyId:Company},{TenantId:Tenant}]
            }
        )
            .complete(function (errGrp, resGrp) {
                if (errGrp) {
                    logger.error('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - Error in searching Group %s ',reqId,GroupID,errGrp);
                    callback(errGrp, undefined);

                } else
                {
                    if (!resGrp) {

                        logger.error('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - No record found for Group %s ',reqId,GroupID);

                        callback(new Error("No group record found"), undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupID);
                        callback(undefined, resGrp);

                    }
                }

            });

    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - Exception in method starting : PickUserGroup ',reqId,GroupID,ex);
        callback(ex,undefined);
    }
}


function GetGroupEndpoints(obj,Company,Tenant,reqId,callback)
{
    try {
        DbConn.UsrGrp
            .findAll({
                where: {CSDBUserGroupId: obj}
            }
        )
            .complete(function (err, result) {
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

            });
    }
    catch(ex)
    {
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception found", false, null);
        logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - Error in starting method :  GetGroupEndpoints',reqId,obj,ex);
        callback(ex, undefined);
    }
}


function PickUsersGroup(SipID,Company,Tenant,reqId,callback)
{
    try {
        
        DbConn.SipUACEndpoint.find({where: [{id: parseInt(SipID)},{CompanyId:Company},{TenantId:Tenant}], include: [{model: DbConn.UserGroup, as:"UserGroup"}],attributes:["id"]})
            .complete(function (errSip, resSip) {

                if (errSip) {
                    logger.error('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - Error in searching UsrGrp records of SipUACEndpoint %s ',reqId,SipID,errSip);
                    callback(errSip, undefined);

                } else {
                    if (!resSip) {
                        logger.error('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - No records for SipUACEndpoint %s ',reqId,SipID);
                        callback(new Error("No group record found"), undefined);

                    } else {
                        logger.debug('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - Records for SipUACEndpoint %s ',reqId,SipID);
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

            });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - Error in Method starting : EndpointGroupID  %S ',reqId,SipID,ex);
        callback(ex,undefined);
    }

}

//get :-done

function PickCompayGroups(Company,reqId,callback)
{
    try{
        DbConn.UserGroup
            .findAll({where : {CompanyId:Company}
            }
        )
            .complete(function(errGroup, resGroup) {
                if (errGroup) {

                    logger.error('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - Error in searching Group records of company %s ',reqId,Company,errGroup);
                    callback(errGroup, undefined);

                } else
                {
                    if (!resGroup) {
                        logger.error('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - No Group records found for company %s ',reqId,Company);
                        callback(new Error("No group record found"), undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - Records found for company %s ',reqId,Company);
                        callback(undefined, resGroup);

                    }
                }
            });


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - Exception on method starts : AllRecWithCompany - Data %s',reqId,Company,ex);
        callback(ex, undefined);
    }
}


function PickUsersInGroup(GroupId,Company,Tenant,reqId,callback)
{

    try {
        DbConn.UserGroup.find({where: [{id: GroupId},{CompanyId:Company},{TenantId:Tenant}], include: [{model: DbConn.SipUACEndpoint , as: "SipUACEndpoint" }]})
            .complete(function (errGroup, resGroup) {
                if (errGroup) {
                    logger.error('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - Error in searching Users of Group %s ',reqId,GroupId,errGroup);
                    callback(errGroup, undefined);

                } else
                {
                    if (!resGroup) {
                        logger.error('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - No User record found for Group %s ',reqId,GroupId);
                        callback(newError("No group record found"), undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupId);
                        callback(undefined, resGroup);

                    }
                }

            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - Exception occurred on start : GetAllUsersInGroup %s ',reqId,GroupId,ex);
        callback(ex, undefined);

    }

}




//post funcs
module.exports.CreateUserGroup = CreateUserGroup;
module.exports.MapExtensionID = MapExtensionID;
module.exports.FillUsrGrp = FillUsrGrp;
module.exports.UpdateUserGroup = UpdateUserGroup;

//get funcs
module.exports.PickUserGroup = PickUserGroup;
module.exports.GetGroupEndpoints = GetGroupEndpoints;
module.exports.PickUsersGroup = PickUsersGroup;
module.exports.PickCompayGroups = PickCompayGroups;
module.exports.PickUsersInGroup = PickUsersInGroup;

