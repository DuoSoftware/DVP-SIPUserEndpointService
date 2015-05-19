/**
 * Created by pawan on 2/20/2015.
 */

var DbConn = require('DVP-DBModels');
var restify = require('restify');
var stringify=require('stringify');
var Sequelize=require('sequelize');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;

/*
 var RestServer = restify.createServer({
 name: "myapp",
 version: '1.0.0'
 },function(req,res)
 {

 });
 //Server listen
 RestServer.listen(8080, function () {
 console.log('%s listening at %s', RestServer.name, RestServer.url);
 //console.log(moment().format('dddd'));


 });

 RestServer.use(restify.bodyParser());
 RestServer.use(restify.acceptParser(RestServer.acceptable));
 RestServer.use(restify.queryParser());

 RestServer.post('/add_usergroup',function(req,res,err)
 {

 AddSipUserGroup(req.body);
 res.end();

 });


 */


//post :-done
function AddSipUserGroup(obj,reqId,callback)
{
    try {
        DbConn.UserGroup.find({where: [{GroupName: obj.GroupName}]}).complete(function (err, GrpObject) {

            if (err) {
                logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s',reqId,obj.GroupName);
                callback(err, undefined);
            }
            else
            {
                if (GrpObject) {
                   // console.log("Already in DB");
                    logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Already in DB Group %s',reqId,obj.GroupName);
                    callback(undefined, GrpObject);
                }
                else  {
                    try {

                        var UserGroupobj = DbConn.UserGroup
                            .build(
                            {

                                GroupName: obj.GroupName,
                                Domain: obj.Domain,
                                ExtraData: obj.ExtraData,
                                ObjClass: obj.ObjClass,
                                ObjType: obj.ObjType,
                                ObjCategory: obj.ObjCategory,
                                CompanyId: obj.CompanyId,
                                TenantId: obj.TenantId


                            }
                        );

                        UserGroupobj.save().complete(function (err, result) {
                            if (!err) {
                                //  ScheduleObject.addAppointment(AppObject).complete(function (errx, AppInstancex) {


                                // res.write(status.toString());
                                // res.end();
                                //});
                                logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - New user group insertion succeeded - Group %s',reqId,JSON.stringify(obj));
                                console.log("..................... Saved Successfully ....................................");
                                callback(undefined, result);


                            }
                            else {
                                logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - New user group insertion failed - Group %s',reqId,JSON.stringify(obj),err);
                                console.log("..................... Error found in saving.................................... : " + err);
                                callback("Error", undefined);

                            }


                        });
                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Exception in New user group insertion  - Group %s',reqId,JSON.stringify(obj),ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "Exception occurred", false, null);
                        callback("Exception : "+ex, undefined);
                    }
                }
            }


        });


    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [PGSQL]  - Exception in user group Searching   - Group %s',reqId,JSON.stringify(obj),ex);
        callback("Exception",undefined);
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
                                console.log(groupObject);

                                try {
                                    groupObject.addSipUACEndpoint(sipObject).complete(function (errx, groupInstancex) {

                                        if (errx) {
                                            callback(errx, undefined)
                                        }
                                        else  {
                                            callback(undefined, groupInstancex)
                                        }


                                        console.log('mapping group and sip done.................');



                                    });
                                }
                                catch (ex) {
                                    callback(ex, undefined);
                                }

                            }

                            else {
                                callback(undefined, undefined);
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
                                callback(undefined, undefined);
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


/*
    try {
        DbConn.SipUACEndpoint
            .findAll({
                where: [{id: obj.CSDBSipUACEndpointId}]
            }
        )
            .complete(function (err, result) {
                if (err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    callback(err, undefined);

                } else
                {
                    if (result) {
                        DbConn.UserGroup
                            .findAll({
                                where: [{id: obj.CSDBUserGroupId}]
                            }
                        )
                            .complete(function (errGroup, result) {
                                if (err) {
                                    console.log('An error occurred while searching for Extension:', err);
                                    //logger.info( 'Error found in searching : '+err );
                                    callback(errGroup, undefined);

                                } else
                                {
                                    if (!result) {
                                    console.log('No user with the Extension has been found.');
                                    ///logger.info( 'No user found for the requirement. ' );
                                    callback(undefined,result);
                                } else {


                                    var GrpObject = DbConn.UsrGrp
                                        .build(
                                        {
                                            CSDBSipUACEndpointId: obj.CSDBSipUACEndpointId,
                                            CSDBUserGroupId: obj.CSDBUserGroupId


                                        }
                                    )

                                        GrpObject.save().complete(function (err) {
                                        if (!err) {
                                            //  ScheduleObject.addAppointment(AppObject).complete(function (errx, AppInstancex) {

                                            var status = 1;


                                            // res.write(status.toString());
                                            // res.end();
                                            //});

                                           // var jsonString = messageFormatter.FormatMessage(null, "Success", true, null);
                                            callback(undefined,true);

                                        }
                                        else {
                                            //var jsonString = messageFormatter.FormatMessage(null, "ERROR", false, null);
                                           callback(err,undefined);

                                        }


                                    });


                                }
                            }
                            });
                } else {


callback(undefined,undefined);

                }
            }

            });

    }
    catch(ex)
    {
        callback(ex,undefined);
    }
    */
}
//post :-done
function UpdateSipUserGroup(AID,obj,reqId,callback)
{
    try {
        DbConn.UserGroup
            .update(
            {
                GroupName: obj.GroupName,
                Domain: obj.Domain,
                ExtraData: obj.ExtraData,
                ObjClass: obj.ObjClass,
                ObjType: obj.ObjType,
                ObjCategory: obj.ObjCategory,
                CompanyId: obj.CompanyId,
                TenantId: obj.TenantId


            },
            {
                where: [{id: AID}]
            }
        ).then(function (result) {
                //logger.info('Successfully Mapped. ');
                logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Updation succeeded -  Data - %s',reqId,JSON.stringify(obj));

               // var jsonString = messageFormatter.FormatMessage(null, "mapping is succeeded", true, null);
                callback(undefined,result);
            }).error(function (err) {
                ////logger.info('mapping error found in saving. : ' + err);
                logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Updation failed -  Data - %s',reqId,JSON.stringify(obj),err);
                var jsonString = messageFormatter.FormatMessage(err, "Updation failed", false, null);
                callback(err,undefined);

            });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Exception in starting method : UpdateSipUserGroup  -  Data - %s',reqId,JSON.stringify(obj),ex);
        callback(ex,undefined);
    }
}

//get :-done

function GetGroupData(obj,reqId,callback)
{
    try {
        DbConn.UserGroup
            .findAll({
                where: [{GroupName: obj}]
            }
        )
            .complete(function (err, result) {
                if (err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    logger.error('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - Error in searching Group %s ',reqId,obj,err);
                    var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for Group:", false, null);
                    callback(err, undefined);

                } else
                {
                    if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                        logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - No record found for Group %s ',reqId,obj,err);
                    var jsonString = messageFormatter.FormatMessage(null, "Null object returns", false, null);
                    callback(undefined, undefined);

                } else {

                        logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,obj);
                    var jsonString = messageFormatter.FormatMessage(result, "Succeeded...", true, result);
                    callback(undefined, result);
                    //console.log(result.Action)

                }
            }

            });

    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - [PGSQL]  - Exception in method starting : GetGroupData ',reqId,obj,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in get data group", false, null);
        callback(ex,undefined);
    }
}

//get:-done
function GetGroupEndpoints(obj,reqId,callback)
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
                    callback(undefined, undefined);

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

//get :-done
function EndpointGroupID(obj,reqId,callback)
{
    try {
        DbConn.UsrGrp
            .findAll({
                where: {CSDBSipUACEndpointId: obj}
            }
        )
            .complete(function (err, result) {
                if (err) {
                    console.log('An error occurred while searching for Extension:', err);
                    logger.error('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - Error in searching UsrGrp records of SipUACEndpoint %s ',reqId,obj,err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for UserGroup", false, null);
                    callback(err, undefined);

                } else {
                    if (!result) {
                        logger.error('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - No records for SipUACEndpoint %s ',reqId,obj);
                        ///logger.info( 'No user found for the requirement. ' );
                        var jsonString = messageFormatter.FormatMessage(err, "No user with the Extension has been found.", false, null);
                        callback(undefined, undefined);

                    } else {
                        logger.debug('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - Records for SipUACEndpoint %s ',reqId,obj);
                        var jsonString = messageFormatter.FormatMessage(null, "Success ", true, result);
                        callback(undefined, result);

                        //console.log(result.Action)

                    }
                }

            });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [PGSQL]  - Error in Method starting : EndpointGroupID  %S ',reqId,obj,ex);
        callback(ex,undefined);
    }

}

//get :-done

function AllRecWithCompany(req,reqId,callback)
{
    try{
    DbConn.UserGroup
        .findAll({where : {CompanyId:req}
        }
    )
        .complete(function(err, result) {
            if (err) {
                console.log('', err);
                //logger.info( 'Error found in searching : '+err );
                logger.error('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - Error in searching Group records of company %s ',reqId,req,err);
                var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for user Group", false, null);
                callback(err, undefined);

            } else
            {
                if (!result) {
                    logger.error('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - No Group records found for company %s ',reqId,req);
                ///logger.info( 'No user found for the requirement. ' );
                var jsonString = messageFormatter.FormatMessage(err, "No user with the user group has been found.", false, null);
                    callback(undefined, undefined);

            } else {

                //var jsonString = messageFormatter.FormatMessage(null, "No user with the user group has been found.", true, result);
                    logger.debug('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - Records found for company %s ',reqId,req);
                    callback(undefined, result);
                //console.log(result.Action)

            }
        }
        });


}
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [PGSQL]  - Exception on method starts : AllRecWithCompany - Data %s',reqId,req,ex);
        callback(ex, undefined);
    }
}

//get :-done
function GetAllUsersInGroup(req,callback)
{

    try {
        DbConn.UserGroup.findAll({where: {id: req}, include: [{model: DbConn.SipUACEndpoint}]})
            .complete(function (err, result) {
                if (err) {
                   // console.log('An error occurred while searching for Extension:', err);
                    logger.error('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - Error in searching Users of Group %s ',reqId,req,err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "error in searching", false, null);
                    callback(err, undefined);

                } else
                {
                    if (!result) {
                        logger.error('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - No User record found for Group %s ',reqId,req);
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "No user with the group has been found.", false, null);
                        callback(undefined, undefined);

                } else {

                        logger.debug('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,req);
                    var jsonString = messageFormatter.FormatMessage(null, "success.", true, result);
                        callback(undefined, result);

                    //console.log(result.Action)

                }
            }

            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [PGSQL]  - Exception occurred on start : GetAllUsersInGroup %s ',reqId,req,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "exception has been found.", false, null);
        callback(ex, undefined);

    }

}

function Testme(req,callback)
{
    DbConn.Schedule.findAll({ where: Sequelize.and({id:req}), include: [

        {
            model:DbConn.Appointment,
            where:Sequelize.or({'ObjCategory':'fdgdgd'})
        }]})

        .complete(function(err, result) {
            if (!!err) {
                console.log('An error occurred while searching for Extension:', err);
                //logger.info( 'Error found in searching : '+err );
                var jsonString = messageFormatter.FormatMessage(err, "error has been found.", false, null);
                callback(null, jsonString);

            } else if (!result) {
                console.log('No user with the Extension has been found.');
                ///logger.info( 'No user found for the requirement. ' );
                var jsonString = messageFormatter.FormatMessage(err, "No user with the Schedule has been found.", false, null);
                callback(null, jsonString);

            } else {

                //var Jresults = result.map(function (result) {
                var jsonString = messageFormatter.FormatMessage(null, "No user with the user group has been found.", true, result);
                callback(null, jsonString);
                //});

                //console.log(result.Action)

            }

        });
    //res.end();

}


//post funcs
module.exports.AddSipUserGroup = AddSipUserGroup;
module.exports.MapExtensionID = MapExtensionID;
module.exports.FillUsrGrp = FillUsrGrp;
module.exports.UpdateSipUserGroup = UpdateSipUserGroup;

//get funcs
module.exports.GetGroupData = GetGroupData;
module.exports.GetGroupEndpoints = GetGroupEndpoints;
module.exports.EndpointGroupID = EndpointGroupID;
module.exports.AllRecWithCompany = AllRecWithCompany;
module.exports.GetAllUsersInGroup = GetAllUsersInGroup;
module.exports.Testme = Testme;
