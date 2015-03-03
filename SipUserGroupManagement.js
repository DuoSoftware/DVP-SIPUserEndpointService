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
    var obj=null;
    obj.GroupName="Gname"+objNum;

    obj.Domain ="GDomain"+objNum;
    obj.ExtraData ="Gextra"+objNum;
    obj.ObjClass= "Gclz"+objNum;
    obj.ObjType ="Gtyp"+objNum;
    obj.ObjCategory= "Gcat"+objNum;
    obj.CompanyId= objNum;
    obj.TenantId= objNum+1;

    var UserGroupobj = DbConn.UserGroup
        .build(
        {

            GroupName:obj.GroupName ,
            Domain :obj.Domain,
            ExtraData :obj.ExtraData,
            ObjClass: obj.ObjClass,
            ObjType :obj.ObjType,
            ObjCategory: obj.ObjCategory,
            CompanyId: obj.CompanyId,
            TenantId: obj.TenantId


        }
    )

    UserGroupobj.save().complete(function (err) {
        if (!err) {
            //  ScheduleObject.addAppointment(AppObject).complete(function (errx, AppInstancex) {

            var status = 1;


            // res.write(status.toString());
            // res.end();
            //});

            console.log("..................... Saved Successfully ....................................");
            return obj;

            res.end();


        }
        else
        {
            console.log("..................... Error found in saving.................................... : "+err);
            res.end();

        }

return next();
    });

}
//post :-done
function MapExtensionID(obj,res)
{
    /*
    DbConn.SipUACEndpoint
        .findAll({where:[{id:obj.ExtensionId}]
        }
    )
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


                DbConn.UserGroup
                    .update(
                    {
                        ExtensionId: obj.ExtensionId


                    },
                    {
                        where: [{ id: obj.id}]
                    }
                ).then(function() {
                        logger.info( 'Successfully Mapped. ');
                        console.log(".......................mapping is succeeded ....................");
                        res.end();

                    }).error(function(err) {
                        logger.info( 'mapping error found in saving. : '+err);
                        console.log("mapping failed ! "+ err);
                        //handle error here
                        res.end();

                    });

            }

        });

    */

    DbConn.SipUACEndpoint.find({where: [{id: obj.ExtensionId}]}).complete(function (err, sipObject) {
        if (!err && sipObject) {
            console.log(sipObject);

            DbConn.UserGroup.find({where: [{id: obj.GroupId}]}).complete(function (err, groupObject) {
                if (!err && sipObject) {
                    console.log(groupObject);


                    groupObject.addCSDB_SipUACEndpoint(sipObject).complete(function (errx, groupInstancex) {

                        console.log('mapping group and sip done.................');
                        // res.write(status.toString());
                        res.end();


                    });


                }
                else {

                    res.end();

                }

            })


        }
        else {

            res.end();

        }

        //return next();
    })




return next();
}
//post :-post
function FillUsrGrp(obj,res)
{
    DbConn.SipUACEndpoint
        .findAll({where:[{id:obj.CSDBSipUACEndpointId}]
        }
    )
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

                DbConn.UserGroup
                    .findAll({where:[{id:obj.CSDBUserGroupId}]
                    }
                )
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

                            console.log("New Record found...... Inserting.............");




                                    // console.log(cloudEndObject);

                                    var GrpObject = DbConn.UsrGrp
                                        .build(
                                        {
                                            CSDBSipUACEndpointId:obj.CSDBSipUACEndpointId,
                                            CSDBUserGroupId:obj.CSDBUserGroupId


                                        }
                                    )

                                    AppObject.save().complete(function (err) {
                                        if (!err) {
                                            //  ScheduleObject.addAppointment(AppObject).complete(function (errx, AppInstancex) {

                                            var status = 1;


                                            // res.write(status.toString());
                                            // res.end();
                                            //});

                                            console.log("..................... Saved Successfully ....................................");
                                            res.end();

                                        }
                                        else
                                        {
                                            console.log("..................... Error found in saving.................................... : "+err);
                                            res.end();

                                        }


                                    });

                                    /*
                                     ContextObject.addExtension(ExtensionObject).complete(function (errx, ContextInstancex)
                                     {
                                     status = status++;
                                     });
                                     }
                                     else {

                                     res.send(status.toString());
                                     res.end();

                                     console.log("Error on loadbalancer save --> ", err);

                                     }


                                     });*/











                        }

                    });


            }

        });
return next();
}
//post :-done
function UpdateSipUserGroup(obj,res)
{

    DbConn.UserGroup
        .update(
        {
            GroupName:obj.GroupName ,
            Domain :obj.Domain,
            ExtraData :obj.ExtraData,
            ObjClass: obj.ObjClass,
            ObjType :obj.ObjType,
            ObjCategory: obj.ObjCategory,
            CompanyId: obj.CompanyId,
            TenantId: obj.TenantId


        },
        {
            where: [{ id: obj.AID }]
        }
    ).then(function() {
            logger.info( 'Successfully Mapped. ');
            console.log(".......................mapping is succeeded ....................");
            res.end();

        }).error(function(err) {
            logger.info( 'mapping error found in saving. : '+err);
            console.log("Update failed ! "+ err);
            //handle error here
            res.end();

        });
    return next();
}











//get :-done

function GetGroupData(obj,res)
{
    DbConn.UserGroup
        .findAll({where : [{GroupName:obj}]
        }
    )
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

                var Jresults = result.map(function (result) {
                    console.log(result.toJSON());
                    return result.toJSON()
                });

                //console.log(result.Action)

            }

        });
    res.end();
}

//get:-done
function GetGroupEndpoints(obj,res)
{

    DbConn.UsrGrp
        .findAll({where : {CSDBUserGroupId:obj.CSDBUserGroupId}
        }
    )
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

                var Jresults = result.map(function (result) {
                    console.log(result.toJSON());
                    return result.toJSON()
                });

                //console.log(result.Action)

            }

        });
    res.end();
}

//get :-done
function EndpointGroupID(obj,res)
{
    DbConn.UsrGrp
        .findAll({where : {CSDBSipUACEndpointId:obj.CSDBSipUACEndpointId}
        }
    )
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

                var Jresults = result.map(function (result) {
                    console.log(result.toJSON());
                    return result.toJSON()
                });

                //console.log(result.Action)

            }

        });
    res.end();
}

//get :-done

function AllRecWithCompany(req,res,err)
{
    DbConn.UserGroup
        .findAll({where : {CompanyId:req}
        }
    )
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

                var Jresults = result.map(function (result) {
                    console.log(result.toJSON());
                    return result.toJSON()
                });

                //console.log(result.Action)

            }

        });

    res.end();
}

//get :-done
function GetAllUsersInGroup(req,res,err)
{
   // DbConn.SipUACEndpoint.findAll({ where: {ExtensionId:req}, include: [DbConn.UserGroup]})
  //DbConn.UserGroup.findAll({ where: {id:req},attributes: ['"CSDB_UserGroup"."GroupName"'], include: [{ model: DbConn.SipUACEndpoint, attributes: ["SipUsername"]}]})
    DbConn.UserGroup.findAll({ where: {id:req}, include: [{ model: DbConn.SipUACEndpoint}]})
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
                   // console.log(result.toJSON().Domain);
                  //return result.toJSON();
               // });

                //console.log(result.Action)

            }

        });
    res.end();
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
