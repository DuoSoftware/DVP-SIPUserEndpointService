/**
 * Created by pawan on 2/20/2015.
 */

var DbConn = require('./../DVP-LimitHandler/DVP-DBModels/index');
var restify = require('restify');
var stringify=require('stringify');
var Sequelize=require('sequelize');
var messageFormatter = require('./../DVP-LimitHandler/DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

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
function AddSipUserGroup(objNum,callback)
{
    try {
        DbConn.UserGroup.find({where: [{GroupName: "Gname" + objNum}]}).complete(function (err, GrpObject) {

            if (err) {
                callback(err, undefined);
            }
            else
            {
                if (GrpObject) {
                    callback(undefined, GrpObject);
                }
                else  {
                    try {
                        var obj = null;
                        obj.GroupName = "Gname" + objNum;

                        obj.Domain = "GDomain" + objNum;
                        obj.ExtraData = "Gextra" + objNum;
                        obj.ObjClass = "Gclz" + objNum;
                        obj.ObjType = "Gtyp" + objNum;
                        obj.ObjCategory = "Gcat" + objNum;
                        obj.CompanyId = objNum;
                        obj.TenantId = objNum + 1;

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
                        )

                        UserGroupobj.save().complete(function (err, result) {
                            if (!err) {
                                //  ScheduleObject.addAppointment(AppObject).complete(function (errx, AppInstancex) {


                                // res.write(status.toString());
                                // res.end();
                                //});

                                console.log("..................... Saved Successfully ....................................");
                                callback(undefined, result);


                            }
                            else {
                                console.log("..................... Error found in saving.................................... : " + err);
                                callback("Error", undefined);

                            }


                        });
                    }
                    catch (ex) {
                        var jsonString = messageFormatter.FormatMessage(ex, "Exception occures", false, null);
                        callback("Exception", undefined);
                    }
                }
            }


        });


    }
    catch(ex)
    {
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
                                    groupObject.addCSDB_SipUACEndpoint(sipObject).complete(function (errx, groupInstancex) {

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
function FillUsrGrp(obj,callback)
{
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
}
//post :-done
function UpdateSipUserGroup(obj,callback)
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
                where: [{id: obj.AID}]
            }
        ).then(function (result) {
                logger.info('Successfully Mapped. ');

               // var jsonString = messageFormatter.FormatMessage(null, "mapping is succeeded", true, null);
                callback(undefined,result);
            }).error(function (err) {
                ////logger.info('mapping error found in saving. : ' + err);
                var jsonString = messageFormatter.FormatMessage(err, "Updation failed", false, null);
                callback(err,undefined);

            });

    }
    catch(ex)
    {
        callback(ex,undefined);
    }
}

//get :-done

function GetGroupData(obj,callback)
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
                    var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for Group:", false, null);
                    callback(err, undefined);

                } else
                {
                    if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(null, "Null object returns", false, null);
                    callback(undefined, undefined);

                } else {


                    var jsonString = messageFormatter.FormatMessage(result, "Succeeded...", true, result);
                    callback(undefined, result);
                    //console.log(result.Action)

                }
            }

            });

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in get data group", false, null);
        callback(ex,undefined);
    }
}

//get:-done
function GetGroupEndpoints(obj,callback)
{
    try {
        DbConn.UsrGrp
            .findAll({
                where: {CSDBUserGroupId: obj.CSDBUserGroupId}
            }
        )
            .complete(function (err, result) {
                if (err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "Error in get group end point", false, null);
                    callback(err, undefined);

                } else
                {
                    if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "No user found", false, null);
                    callback(undefined, undefined);

                } else {

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
        callback(ex, undefined);
    }
}

//get :-done
function EndpointGroupID(obj,callback)
{
    try {
        DbConn.UsrGrp
            .findAll({
                where: {CSDBSipUACEndpointId: obj.CSDBSipUACEndpointId}
            }
        )
            .complete(function (err, result) {
                if (err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for UserGroup", false, null);
                    callback(err, undefined);

                } else {
                    if (!result) {
                        console.log('No user with the Extension has been found.');
                        ///logger.info( 'No user found for the requirement. ' );
                        var jsonString = messageFormatter.FormatMessage(err, "No user with the Extension has been found.", false, null);
                        callback(undefined, undefined);

                    } else {
                        var jsonString = messageFormatter.FormatMessage(null, "Success ", true, result);
                        callback(undefined, result);

                        //console.log(result.Action)

                    }
                }

            });

    }
    catch(ex)
    {
        callback(ex,undefined);
    }

}

//get :-done

function AllRecWithCompany(req,callback)
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
                var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for user Group", false, null);
                callback(err, undefined);

            } else
            {
                if (!result) {
                console.log('No user with the Extension has been found.');
                ///logger.info( 'No user found for the requirement. ' );
                var jsonString = messageFormatter.FormatMessage(err, "No user with the user group has been found.", false, null);
                    callback(undefined, undefined);

            } else {

                //var jsonString = messageFormatter.FormatMessage(null, "No user with the user group has been found.", true, result);
                    callback(undefined, result);
                //console.log(result.Action)

            }
        }
        });


}
    catch(ex)
    {
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
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "error in searching", false, null);
                    callback(err, undefined);

                } else
                {
                    if (!result) {
                    console.log('');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "No user with the group has been found.", false, null);
                        callback(undefined, undefined);

                } else {

                    var jsonString = messageFormatter.FormatMessage(null, "success.", true, result);
                        callback(undefined, result);

                    //console.log(result.Action)

                }
            }

            });
    }
    catch(ex)
    {
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
