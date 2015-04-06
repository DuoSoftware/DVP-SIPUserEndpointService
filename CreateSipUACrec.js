/**
 * Created by pawan on 2/2/2015.
 */

var DbConn = require('./DVP-DBModels');
var DbSave=require('./SaveUAC.js');
var DbUpdate=require('./UpdateSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './SipUACMgtLog.log' })

    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './SipUACMgtLog.log' })
    ]
});


function SaveSip(reqz,callback) {
    logger.info('Start Saving new SipUAC');
    try {
        var obj = reqz.body;//
        logger.info('Request : ' + obj);

    }
    catch (ex) {
        console.log("Error in adding new items to object created using request body");
        logger.info('Exception found : ' + ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback(null,jsonString);
    }


    /* function SaveSt(error, st) {
     try {
     if (st >0 && error == null) {
     console.log("New Record is Added Successfully");
     var jsonString = messageFormatter.FormatMessage(ex, "Success", true, null);
     resz.end(jsonString);
     }
     else {
     console.log("New Record Saving Error " + error);
     var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
     resz.end(jsonString);
     }
     }

     catch (ex) {
     Console.log("Error found in Save status return : " + ex);
     var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
     resz.end(jsonString);
     }

     };*/

    logger.info('Search in db for record : ' + obj.SipUsername + ' , ' + obj.CompanyId + ' , ' + obj.TenantId);


    try {
        DbConn.SipUACEndpoint
            .find({where: [{SipUsername: obj.SipUsername}, {CompanyId: obj.CompanyId}, {TenantId: obj.TenantId}]})
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for SipUAC record:');
                    logger.info('Error found in searching : ' + err);
                    var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for SipUAC record", false, result);
                    callback(null,jsonString);

                } else if (result == null) {
                    console.log('No user with the Extension ' + obj.SipUsername + ' has been found.');
                    logger.info('No user found for the requirement. ');
                    try {


                        //call external save function, params = Json object and callback function

                        console.log('................................. New SIP User is creating ..................................');

                        SaveUACRec(obj, function (error, st) {
                            try {
                                if(error)
                                {
                                    callback(error,undefined);
                                }
                                else {

                                    if (st) {
                                        console.log("New Record is Added Successfully");
                                        var jsonString = messageFormatter.FormatMessage(null, "SuccessFully stated", true, null);
                                        callback(undefined, jsonString);
                                    }
                                    else {
                                        console.log("New Record Saving Error " + error);
                                        var jsonString = messageFormatter.FormatMessage(error, "ERROR in state", false, null);
                                        callback("Error returns", undefined);
                                    }
                                }
                            }

                            catch (ex) {
                                console.log("Error found in Save status return : " + ex);
                                var jsonString = messageFormatter.FormatMessage(ex, "Exception in state", false, null);
                                callback("Exception found",jsonString);
                            }

                        });


                    }
                    catch (ex) {
                        console.log("An error occurred in data saving process ");
                        logger.info('Error found in saving process ');

                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback(null,jsonString);


                    }


                } else {
                    console.log('............................Context Found ' + result.SipUsername + '! ................................');
                    console.log('All attributes of Context:', result.values);
                    console.log('Cannot overwrite this record.Check given details........\n');
                    logger.info('Record Found, No updations happen ');
                    var jsonString = messageFormatter.FormatMessage(null, "Cannot overwrite this record.Check given details........\n", false, result);
                    callback(null,jsonString);


                }
            });

    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in Saving sip", false, null);
        callback(null,jsonString);
    }


//return next();
}


function SaveUACRec(jobj,callback) {
    // Add all  details of new user

    logger.info( 'Saving UAC Records : '+JSON.stringify(jobj));
    if (jobj) {
        logger.info('Check CloudEndUser for  Records : ' + jobj.CSDBCloudEndUserId);

        try{
            DbConn.CloudEndUser.find({where: [{id: jobj.CSDBCloudEndUserId}]}).complete(function (err, cloudEndObject) {

                if(err)
                {
                    callback(err,undefined);
                }
                else {

                    if (cloudEndObject) {
                        // console.log(cloudEndObject);
                        logger.info(' CloudEndUserID found,No errors ');
                        logger.info('Check Context for  Records : ' + jobj.CSDBContextContext);
                        DbConn.Context.find({where: [{Context: jobj.CSDBContextContext}]}).complete(function (errz, ContextObject) {

                            if (errz) {
                                callback(errz,undefined);
                            }
                            else
                            {
                                if (ContextObject) {
                                    logger.info(' CSDBContextContext found,No errors ');
                                    logger.info(' Creating SipObject ');
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

                                    SIPObject.save().complete(function (errSave) {
                                        if (!errSave) {
                                            //var status = 0;
                                            logger.info(' SipObject created : ' + SIPObject);

                                            cloudEndObject.addSipUACEndpoint(SIPObject).complete(function (errCloud, CloudEndInstancex) {
                                                //logger.info(' CSDBCloudEndUserId filled  ' + cloudEndObject);
                                                // status++;
                                                if(errCloud)
                                                {
                                                    callback('Error in mapping CEU & SipUAC',undefined);
                                                }
                                                else
                                                {
                                                    ContextObject.addSipUACEndpoint(SIPObject).complete(function (errContext, ContextInstancex) {
                                                        // logger.info(' CSDBContextContext filled  ' + ContextObject);

                                                        if(errContext)
                                                        {
                                                            callback('Error in mapping Context & SipUAC',undefined);
                                                        }
                                                        else
                                                        {
                                                            callback(undefined,ContextInstancex);
                                                        }


                                                        // status = status++;
                                                    });
                                                }


                                                // res.write(status.toString());
                                                // res.end();
                                            });

                                            console.log("..................... Saved Successfully ....................................");
                                            logger.info('Save Succeeded');
                                            callback(null, true);
                                        }
                                        else {
                                            console.log(err + " found");
                                            console.log("..................... Error found in saving....................................");
                                            logger.info('Error found in saving');
                                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                            callback(err, undefined);


                                        }

                                    });


                                }
                                else  {
                                    console.log("................................... Given Context is invalid ................................ ");
                                    logger.info('Given Context is invalid : ' + jobj.CSDBContextContext);
                                    logger.info('Returned ContextObject : ' + ContextObject);
                                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ContextObject);
                                    callback("Error occured",undefined);


                                }
                            }
                        });
                    }
                    else  {
                        console.log("................................... Given Cloud End User is invalid ................................ ");
                        logger.info('Given cloudEnd is invalid : ' + jobj.CSDBCloudEndUserId);
                        logger.info('Returned cloudEndObject : ' + cloudEndObject);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, cloudEndObject);
                        callback("Error Returns",undefined);
                    }

                }

            });

        }
        catch(ex)
        {
            var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
            callback("Exception found",undefined);

        }
    }
    else{

        res.send(status.toString());
        res.end();
        console.log("obj is null in SetExtension");
        logger.info( 'Request object is invalid : '+jobj );
        callback("No object recieved ",undefined);
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
                else if(result.length>0){
                    // console.log('Context Found ' + result.Context + '!');
                    //console.log('All attributes of Context:', result.values);
                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    resz.end(jsonString);
                    /*
                     for(var i=result.length;i>=0;i--)
                     {

                     console.log('\n new result found  '+Jresults+'\n');
                     }*/


                    // set as Json Object



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
                else if(result.length>0){
                    // console.log('Context Found ' + result.Context + '!');
                    //console.log('All attributes of Context:', result.values);
                    var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                    resz.end(jsonString);
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