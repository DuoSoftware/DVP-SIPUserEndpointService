/**
 * Created by pawan on 2/2/2015.
 */

var DbConn = require('./DVP-DBModels');
var DbSave=require('./SaveUAC.js');
var DbUpdate=require('./UpdateSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');

var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './SipUACMgtLog.log' })

    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './SipUACMgtLog.log' })
    ]
});



/*


 // Create Restify Server
 var RestServer = restify.createServer({
 name: "myapp",
 version: '1.0.0'
 },function(req,res)
 {

 });





 //Server listen
 RestServer.listen(8080, function () {
 console.log('%s listening at %s', RestServer.name, RestServer.url);
 });
 //Enable request body parsing(access)
 RestServer.use(restify.bodyParser());
 RestServer.use(restify.acceptParser(RestServer.acceptable));
 RestServer.use(restify.queryParser());


 */

function SaveSip(reqz,resz,errz)
{
    logger.info( 'Start Saving new SipUAC' );
    try {
        var obj = reqz.body;//
        logger.info( 'Request : '+obj );
        //Add other vars to object
        // obj.CompanyId = 1;
        //obj.TenantId = 2;
        // obj.AddUser = "NAddUser";
        // obj.UpdateUser = "NUpdateUser";
        // obj.AddTime = new Date(2013, 01, 13);
        // obj.UpdateTime = new Date(2013, 01, 28);
    }


    catch (ex)
    {
        console.log("Error in adding new items to object created using request body");
        logger.info( 'Exception found : '+ex );
        resz.end();
    }


    function SaveSt(error,st)
    {
        try {
            if (st && error == null) {
                console.log("New Record is Added Successfully");
            }
            else {
                console.log("New Record Saving Error " + error);
            }
        }

        catch (ex)
        {
            Console.log("Error found in Save status return : "+ex);
        }

    };



    logger.info( 'Search in db for record : '+obj.SipUsername+' , '+obj.CompanyId+' , '+obj.TenantId);
    DbConn.SipUACEndpoint
        .find({ where: [{ SipUsername: obj.SipUsername },{CompanyId:obj.CompanyId},{TenantId:obj.TenantId}]})
        .complete(function(err, result) {
            if (!!err) {
                console.log('An error occurred while searching for Extension:', err);
                logger.info( 'Error found in searching : '+err );
              resz.end();

            } else if (!result) {
                console.log('No user with the Extension '+obj.SipUsername+' has been found.');
                logger.info( 'No user found for the requirement. ' );
                try
                {

                    //DbSave.SaveNewSipUser(jobj.Context,jobj.Description,1,2,jobj.ObjClass,jobj.ObjType,jobj.ObjCategory,"AddUser1","UpdateUSer1",new Date(2015,01,12),new Date(2015,01,26),SaveSt);

                    //call external save function, params = Json object and callback function

                    console.log('................................. New SIP User is creating ..................................');

                    SaveUACRec(obj,SaveSt);
                 resz.end();

                }
                catch(ex)
                {
                    console.log("An error occurred in data saving process ");
                    logger.info( 'Error found in saving process ' );
               resz.end();

                }

            } else {
                console.log('............................Context Found ' + result.SipUsername + '! ................................');
                console.log('All attributes of Context:', result.values);
                console.log('Cannot overwrite this record.Check given details........\n');
                logger.info( 'Record Found, No updations happen ' );
                resz.end();
                /*

                 DbConn.Extension
                 .update(
                 {

                 ExtensionName: obj.ExtensionName,
                 Password: obj.Password,
                 Domain: obj.Domain,
                 Enabled: obj.Enabled,
                 // Context: obj.Context,
                 ExtraData: obj.ExtraData,
                 EmailAddress: obj.EmailAddress,
                 ExtRefId: obj.ExtRefId,
                 CompanyId: obj.CompanyId,
                 TenantId: obj.TenantId,
                 ObjClass: obj.ObjClass,
                 ObjType: obj.ObjType,
                 ObjCategory: obj.ObjCategory,
                 AddUser: obj.AddUser,
                 UpdateUser: obj.UpdateUser
                 // AddTime: new Date(2009, 10, 11),
                 //UpdateTime: new Date(2009, 10, 14)
                 },
                 {
                 where:

                 {
                 Extension:obj.Extension
                 }
                 }
                 ).then(function() {

                 console.log("Updated successfully!");

                 }).error(function(err) {

                 console.log("Project update failed ! "+ err);
                 //handle error here

                 });
                 */

            }
        });


//return next();
}


function SaveUACRec(jobj,callback) {
    // Add all  details of new user

    logger.info( 'Saving UAC Records : '+jobj );
    if (jobj)
    {
        logger.info( 'Check CloudEndUser for  Records : '+jobj.CSDBCloudEndUserId );
        DbConn.CloudEndUser.find({where: [{ id: jobj.CSDBCloudEndUserId}]}).complete(function(err, cloudEndObject) {
            if (!err && cloudEndObject) {
                // console.log(cloudEndObject);
                logger.info( ' CloudEndUserID found,No errors ' );
                logger.info( 'Check Context for  Records : '+jobj.CSDBContextContext );
                DbConn.Context.find({where: [{ Context: jobj.CSDBContextContext}]}).complete(function(err, ContextObject){

                    if (!err && ContextObject) {
                        logger.info( ' CSDBContextContext found,No errors ' );
                        logger.info( ' Creating SipObject ' );
                        var SIPObject = DbConn.SipUACEndpoint
                            .build(
                            {
                                SipUsername: jobj.SipUsername,
                                Password: jobj.Password,
                                Enabled: jobj.Enabled,
                                ExtraData: jobj.ExtraData,
                                EmailAddress: jobj.EmailAddress,
                                GuRefId: jobj.GuRefId,
                                CompanyId: jobj.CompanyId,
                                TenantId: jobj.TenantId,
                                ObjClass: jobj.ObjClass,
                                ObjType: jobj.ObjType,
                                ObjCategory: jobj.ObjCategory,
                                AddUser: jobj.AddUser,
                                UpdateUser: jobj.UpdateUser
                                // AddTime: new Date(2009, 10, 11),
                                //  UpdateTime: new Date(2009, 10, 12),
                                // CSDBCloudEndUserId: jobj.CSDBCloudEndUserId


                            }
                        )

                        SIPObject.save().complete(function (err) {
                            if (!err) {

                                logger.info( ' SipObject created : '+SIPObject );

                                cloudEndObject.addSipUACEndpoint(SIPObject).complete(function (errx, CloudEndInstancex) {
                                    logger.info( ' CSDBCloudEndUserId filled  '+cloudEndObject );
                                    var status = 1;

                                    ContextObject.addSipUACEndpoint(SIPObject).complete(function (errx, ContextInstancex)
                                    {
                                        logger.info( ' CSDBContextContext filled  '+ContextObject );
                                        status = status++;
                                    });
                                    // res.write(status.toString());
                                    // res.end();
                                });

                                console.log("..................... Saved Successfully ....................................");
                                logger.info( 'Save Succeeded' );
                            }
                            else
                            {
                                console.log("..................... Error found in saving....................................");
                                logger.info( 'Error found in saving' );
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
                    else if(!ContextObject)
                    {
                        console.log("................................... Given Context is invalid ................................ ");
                        logger.info( 'Given Context is invalid : '+jobj.CSDBContextContext );
                        logger.info( 'Returned ContextObject : '+ContextObject );

                    }
                });
            }
            else if(!cloudEndObject)
            {
                console.log("................................... Given Cloud End User is invalid ................................ ");
                logger.info( 'Given cloudEnd is invalid : '+jobj.CSDBCloudEndUserId );
                logger.info( 'Returned cloudEndObject : '+cloudEndObject );
            }
            else{
                console.log("hhghg");
            }

        });
    }
    else{

        res.send(status.toString());
        res.end();
        console.log("obj is null in SetExtension");
        logger.info( 'Request object is invalid : '+jobj );

    }
}



/*
 RestServer.post('/dvp/:version/save_uac',function(req,res,err)
 {

 SaveSip(req,res,err);

 res.end();
 return next();

 });

 RestServer.post('/dvp/:version/updt_uac',function(req,res,err)
 {

 var objz=req.body;
 DbUpdate.UpdateUacUserData(objz,res);
 res.end();
 return next();

 });

 */


function GetFunc(reqz,resz,errz)
{
    try {

        DbConn.Extensions
            // .find({ where: { Context: req.params.context } })
            .findAll({where: {CompanyId: reqz.params.cmpid}})
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Context:', err)
                    // res.end();
                } else if (!result) {
                    //console.log('No user with the Context '+reqz.params.context+' has been found.');

                    // res.end();
                }
                else {
                    // console.log('Context Found ' + result.Context + '!');
                    //console.log('All attributes of Context:', result.values);
                    try {
                        var Jresults = result.map(function (result) {
                            return result.toJSON()
                        });
                    }
                    catch (ex)
                    {
                        console.log("Error in creating json object to return : "+ex);
                    }
                    /*
                     for(var i=result.length;i>=0;i--)
                     {

                     console.log('\n new result found  '+Jresults+'\n');
                     }*/


                    // set as Json Object
                    var jarr = JSON.stringify(Jresults);

                    console.log(jarr);


                    resz.write(jarr);
                    //resz=jarr;

                    resz.end();


                }
            });
    }
    catch (ex)
    {
        console.log("Error in searching data : "+ex);
    }
}

function GetFuncRefId(reqz,resz,errz)
{
    try {

        DbConn.Extensions
            // .find({ where: { Context: req.params.context } })
            .findAll({where: {ExtRefId: reqz.params.refid}})
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Context:', err)
                    // res.end();
                } else if (!result) {
                    //console.log('No user with the Context '+reqz.params.context+' has been found.');

                    // res.end();
                }
                else {
                    // console.log('Context Found ' + result.Context + '!');
                    //console.log('All attributes of Context:', result.values);
                    try {
                        var Jresults = result.map(function (result) {
                            return result.toJSON()
                        });
                    }
                    catch (ex)
                    {
                        console.log("Error in creating json object to return : "+ex);
                    }
                    /*
                     for(var i=result.length;i>=0;i--)
                     {

                     console.log('\n new result found  '+Jresults+'\n');
                     }*/


                    // set as Json Object
                    var jarr = JSON.stringify(Jresults);

                    console.log(jarr);


                    resz.write(jarr);
                    //resz=jarr;

                    resz.end();


                }
            });
    }
    catch (ex)
    {
        console.log("Error in searching data : "+ex);
    }
    resz.end();
}

/*

 RestServer.get('/dvp/:version/get_uac/cmp/:cmpid',function(req,res,err)
 {
 GetFunc(req,res,err);


 });

 RestServer.get('/dvp/:version/get_uac/ref/:refid',function(req,res,err)
 {
 GetFuncRefId(req,res,err);


 });
 */

module.exports.SaveSip = SaveSip;
//module.exports.UpdateSip = UpdateSip;