/**
 * Created by pawan on 2/20/2015.
 */

var DbConn = require('./DVP-DBModels');
var restify = require('restify');
var stringify=require('stringify');
var Sequelize=require('sequelize');

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
function AddSipUserGroup(objNum,res)
{
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
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        res.end(jsonString);
    }

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
        )

        UserGroupobj.save().complete(function (err) {
            if (!err) {


                var status = 1;




                console.log("..................... Saved Successfully ....................................");


                var jsonString = messageFormatter.FormatMessage(ex, "SUCCESS", true, obj);
                res.end(jsonString);


            }
            else {
                console.log("..................... Error found in saving.................................... : " + err);
                var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
                res.end(jsonString);

            }

            return next();
        });
    }
    catch (ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        res.end(jsonString);
    }
}
//post :-done
function MapExtensionID(obj,res)
{
    try {

        DbConn.SipUACEndpoint.find({where: [{id: obj.ExtensionId}]}).complete(function (err, sipObject) {
            if (!err && sipObject) {
                console.log(sipObject);


                DbConn.UserGroup.find({where: [{id: obj.GroupId}]}).complete(function (err, groupObject) {
                    if (!err && groupObject) {
                        console.log(groupObject);


                        groupObject.addCSDB_SipUACEndpoint(sipObject).complete(function (errx, groupInstancex) {

                            console.log('mapping group and sip done.................');
                            // res.write(status.toString());
                            var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, groupObject);
                            res.end(jsonString);


                        });


                    }
                    else {

                        var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, groupObject);
                        res.end(jsonString);

                    }

                })


            }
            else {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, sipObject);
                res.end(jsonString);

            }

            //return next();
        })

    }
    catch (ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
        res.end(jsonString);
    }


//return next();
}
//post :-post
function FillUsrGrp(obj,res) {

    try{

        DbConn.SipUACEndpoint
            .findAll({
                where: [{id: obj.CSDBSipUACEndpointId}]
            }
        )
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    res.end(jsonString);

                } else if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, result);
                    res.end(jsonString);
                } else {
                    try{
                        DbConn.UserGroup
                            .findAll({
                                where: [{id: obj.CSDBUserGroupId}]
                            }
                        )
                            .complete(function (err, result) {
                                if (!!err) {
                                    console.log('An error occurred while searching for Extension:', err);
                                    //logger.info( 'Error found in searching : '+err );
                                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                                    res.end(jsonString);

                                } else if (!result) {
                                    console.log('No user with the Extension has been found.');
                                    ///logger.info( 'No user found for the requirement. ' );
                                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, result);
                                    res.end(jsonString);
                                } else {

                                    console.log("New Record found...... Inserting.............");

                                    try{
                                        // console.log(cloudEndObject);

                                        var GrpObject = DbConn.UsrGrp
                                            .build(
                                            {
                                                CSDBSipUACEndpointId: obj.CSDBSipUACEndpointId,
                                                CSDBUserGroupId: obj.CSDBUserGroupId


                                            }
                                        )

                                        AppObject.save().complete(function (err,result) {
                                            if (!err) {


                                                var status = 1;




                                                console.log("..................... Saved Successfully ....................................");
                                                var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                                                res.end(jsonString);

                                            }
                                            else {
                                                console.log("..................... Error found in saving.................................... : " + err);
                                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                                                res.end(jsonString);

                                            }


                                        });


                                    }
                                    catch(ex)
                                    {
                                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                                        res.end(jsonString);
                                    }

                                }

                            });

                    }
                    catch(ex)
                    {
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        res.end(jsonString);
                    }
                }

            });

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
        res.end(jsonString);
    }
    return next();
}
//post :-done
function UpdateSipUserGroup(obj,res) {
    try{
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
        ).then(function (err,result) {
                logger.info('Successfully Mapped. ');
                console.log(".......................mapping is succeeded ....................");
                var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                res.end(jsonString);

            }).error(function (err) {
                logger.info('mapping error found in saving. : ' + err);
                console.log("Update failed ! " + err);
                //handle error here
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                res.end(jsonString);

            });
    }
    catch (ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", true, obj);
        res.end(jsonString);
    }
    return next();
}


//get :-done

function GetGroupData(obj,res) {

    try{
        DbConn.UserGroup
            .findAll({
                where: [{GroupName: obj}]
            }
        )
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    res.end(jsonString);

                } else if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, result);
                    res.end(jsonString);

                } else {

                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    res.end(jsonString);

                    //console.log(result.Action)

                }

            });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
        res.end(jsonString);
    }
}

//get:-done
function GetGroupEndpoints(obj,res)
{
    try {
        DbConn.UsrGrp
            .findAll({
                where: {CSDBUserGroupId: obj.CSDBUserGroupId}
            }
        )
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    res.end(jsonString);

                } else if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, result);
                    res.end(jsonString);

                } else {

                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    res.end(jsonString);

                    //console.log(result.Action)

                }

            });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, result);
        res.end(jsonString);
    }
}

//get :-done
function EndpointGroupID(obj,res) {

    try{
        DbConn.UsrGrp
            .findAll({
                where: {CSDBSipUACEndpointId: obj.CSDBSipUACEndpointId}
            }
        )
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    res.end(jsonString);

                } else if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, result);
                    res.end(jsonString);
                } else {

                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    res.end(jsonString);

                    //console.log(result.Action)

                }

            });

    }
    catch (ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
        res.end(jsonString);
    }
}

//get :-done

function AllRecWithCompany(req,res,err)
{
    try {
        DbConn.UserGroup
            .findAll({
                where: {CompanyId: req}
            }
        )
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    res.end(jsonString);

                } else if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, result);
                    res.end(jsonString);

                } else {

                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    res.end(jsonString);

                    //console.log(result.Action)

                }

            });

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        res.end(jsonString);
    }
}

//get :-done
function GetAllUsersInGroup(req,res,err) {

    try{
        DbConn.UserGroup.findAll({where: {id: req}, include: [{model: DbConn.SipUACEndpoint}]})
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Extension:', err);
                    //logger.info( 'Error found in searching : '+err );
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    res.end(jsonString);

                } else if (!result) {
                    console.log('No user with the Extension has been found.');
                    ///logger.info( 'No user found for the requirement. ' );
                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", false, result);
                    res.end(jsonString);

                } else {

                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    res.end(jsonString);
                    //console.log(result.Action)

                }

            });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        res.end(jsonString);
    }
}

function Testme(req,res,err)
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
                res.end();

            } else if (!result) {
                console.log('No user with the Extension has been found.');
                ///logger.info( 'No user found for the requirement. ' );
                res.end();

            } else {

                //var Jresults = result.map(function (result) {
                console.log(result.toJSON());
                return result.toJSON()
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
