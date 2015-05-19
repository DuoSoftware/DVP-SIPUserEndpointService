/**
 * Created by pawan on 2/2/2015.
 */

var DbConn = require('DVP-DBModels');
var DbSave=require('./SaveUAC.js');
var DbUpdate=require('./UpdateSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;




function SaveSip(reqz,callback) {
    //logger.info('Start Saving new SipUAC');
    try {
        var obj = reqz.body;//
        //logger.info('Request : ' + obj);

    }
    catch (ex) {
        //console.log("Error in adding new items to object created using request body");
        //logger.info('Exception found : ' + ex);
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

    //logger.info('Search in db for record : ' + obj.SipUsername + ' , ' + obj.CompanyId + ' , ' + obj.TenantId);
    logger.debug('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - Searching for SipUACEndPoint %s ',reqId,obj.SipUsername);

    try {
        DbConn.SipUACEndpoint
            .find({where: [{SipUsername: obj.SipUsername}, {CompanyId: 1}, {TenantId: 1}]})
            .complete(function (err, result) {
                if (err) {
                    //console.log('An error occurred while searching for SipUAC record:');
                    logger.error('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - error occurred while searching for SipUACEndPoint %s ',reqId,obj.SipUsername,err);
                    var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for SipUAC record", false, result);
                    callback(null,jsonString);

                } else if (result == null) {
                    //console.log('No user with the Extension ' + obj.SipUsername + ' has been found.');
                    logger.debug('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - No record found for SipUACEndPoint %s ',reqId,obj.SipUsername);
                    try {



                        logger.debug('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - Saving new sip user %s',reqId,JSON.stringify(obj));

                        SaveUACRec(obj,reqId,function (error, st) {

                                if(error)
                                {
                                    callback(error,undefined);
                                }
                                else {

                                    if (st) {
                                       // console.log("New Record is Added Successfully");
                                        var jsonString = messageFormatter.FormatMessage(null, "SuccessFully stated", true, null);
                                        callback(undefined, jsonString);
                                    }
                                    else {
                                        //console.log("New Record Saving Error " + error);
                                        var jsonString = messageFormatter.FormatMessage(error, "ERROR in state", false, null);
                                        callback("Error returns", undefined);
                                    }
                                }




                        });


                    }
                    catch (ex) {
                        //console.log("An error occurred in data saving process ");
                        logger.error('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - Exception in saving UAC recs',reqId,ex);

                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                        callback(null,jsonString);


                    }


                } else {
                   // console.log('............................Context Found ' + result.SipUsername + '! ................................');
                    //console.log('All attributes of Context:', result.values);
                    //console.log('Cannot overwrite this record.Check given details........\n');
                    logger.error('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - [PGSQL] - Found sip user %s',reqId,result.SipUsername);
                    var jsonString = messageFormatter.FormatMessage(null, "Cannot overwrite this record.Check given details........\n", false, result);
                    callback(null,jsonString);


                }
            });

    }
    catch (ex) {
        logger.error('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - [PGSQL] - Exception in starting : SaveSip of %s',reqId,obj.SipUsername,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in Saving sip", false, null);
        callback(null,jsonString);
    }


//return next();
}


function SaveUACRec(jobj,reqId,callback) {
    // Add all  details of new user

    //logger.info( 'Saving UAC Records : '+JSON.stringify(jobj));
    if (jobj) {
        //logger.info('Check CloudEndUser for  Records : ' + jobj.CSDBCloudEndUserId);
        logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s]  - Searching Records of CloudEndUser %s ',reqId,jobj.CSDBCloudEndUserId);
        try{
            DbConn.CloudEndUser.find({where: [{id: jobj.CSDBCloudEndUserId}]}).complete(function (err, cloudEndObject) {

                if(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - Error in Searching Records of CloudEndUser %s ',reqId,jobj.CSDBCloudEndUserId,err);
                    callback(err,undefined);
                }
                else {

                    if (cloudEndObject) {
                        // console.log(cloudEndObject);
                        //logger.info(' CloudEndUserID found,No errors ');
                        //logger.info('Check Context for  Records : ' + jobj.CSDBContextContext);
                        logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - Record found for CloudEndUser %s and searching for Context %s',reqId,jobj.CSDBCloudEndUserId,jobj.CSDBContextContext);
                        DbConn.Context.find({where: [{Context: jobj.CSDBContextContext}]}).complete(function (errz, ContextObject) {

                            if (errz) {
                                logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - Error in Searching Records of Context %s ',reqId,jobj.CSDBContextContext,errz);
                                callback(errz,undefined);
                            }
                            else
                            {
                                if (ContextObject) {
                                    //logger.info(' CSDBContextContext found,No errors ');
                                    //logger.info(' Creating SipObject ');
                                    logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - Record found for Context %s and saving SipUser',reqId,jobj.CSDBContextContext);
                                    var SIPObject = DbConn.SipUACEndpoint
                                        .build(
                                        {
                                            SipUsername: jobj.SipUsername,
                                            Password: jobj.Password,
                                            Enabled: jobj.Enabled,
                                            ExtraData: jobj.ExtraData,
                                            EmailAddress: jobj.EmailAddress,
                                            GuRefId: jobj.GuRefId,
                                            CompanyId: 1,
                                            TenantId: 1,
                                            ObjClass: jobj.ObjClass,
                                            ObjType: jobj.ObjType,
                                            ObjCategory: jobj.ObjCategory,
                                            AddUser: jobj.AddUser,
                                            UpdateUser: jobj.UpdateUser
                                            // AddTime: new Date(2009, 10, 11),
                                            //  UpdateTime: new Date(2009, 10, 12),
                                            // CSDBCloudEndUserId: jobj.CSDBCloudEndUserId


                                        }
                                    );

                                    SIPObject.save().complete(function (errSave) {
                                        if (!errSave) {
                                            //var status = 0;
                                            //logger.info(' SipObject created : ' + SIPObject);
                                            logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - SipUser record added successfully',reqId);

                                            cloudEndObject.addSipUACEndpoint(SIPObject).complete(function (errCloud, CloudEndInstancex) {
                                                //logger.info(' CSDBCloudEndUserId filled  ' + cloudEndObject);
                                                // status++;
                                                if(errCloud)
                                                {
                                                    logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - Error in mapping cloud %s and SipUser %s',reqId,JSON.stringify(cloudEndObject),JSON.stringify(SIPObject),errCloud);
                                                    callback('Error in mapping CEU & SipUAC',undefined);
                                                }
                                                else
                                                {
                                                    logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] -Successfully Mapping cloud %s and SipUser %s',reqId,JSON.stringify(cloudEndObject),JSON.stringify(SIPObject));
                                                    ContextObject.addSipUACEndpoint(SIPObject).complete(function (errContext, ContextInstancex) {
                                                        // logger.info(' CSDBContextContext filled  ' + ContextObject);

                                                        if(errContext)
                                                        {
                                                            logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] -Error in Mapping context %s and SipUser %s',reqId,JSON.stringify(ContextObject),JSON.stringify(SIPObject),errContext);
                                                            callback('Error in mapping Context & SipUAC',undefined);
                                                        }
                                                        else
                                                        {
                                                            logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] -Successfully Mapping context %s and SipUser %s',reqId,JSON.stringify(ContextObject),JSON.stringify(SIPObject));
                                                            callback(undefined,ContextInstancex);
                                                        }


                                                        // status = status++;
                                                    });
                                                }


                                                // res.write(status.toString());
                                                // res.end();
                                            });


                                            //ogger.info('Save Succeeded');
                                            callback(null, true);
                                        }
                                        else {
                                            logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] -Error in inserting Sip user records %s',reqId,JSON.stringify(jobj),errSave);
                                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                            callback(err, undefined);


                                        }

                                    });


                                }
                                else  {

                                    //logger.info('Given Context is invalid : ' + jobj.CSDBContextContext);
                                   // logger.info('Returned ContextObject : ' + ContextObject);
                                    logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - No record found for context %s',reqId,jobj.CSDBContextContext);
                                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, ContextObject);
                                    callback("Error occured",undefined);


                                }
                            }
                        });
                    }
                    else  {

                        //logger.info('Given cloudEnd is invalid : ' + jobj.CSDBCloudEndUserId);
                        //logger.info('Returned cloudEndObject : ' + cloudEndObject);
                        logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - No record found for cloudEnduser %s',reqId,jobj.CSDBCloudEndUserId);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, cloudEndObject);
                        callback("Error Returns",undefined);
                    }

                }

            });

        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - Exception in searching cloudEnduser %s',reqId,jobj.CSDBCloudEndUserId,ex);
            var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
            callback("Exception found",undefined);

        }
    }
    else{

        //res.send(status.toString());
        //res.end();
        //console.log("obj is null in SetExtension");
        //ogger.info( 'Request object is invalid : '+jobj );
        logger.error('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [PGSQL] - Invalid object received at the start : SaveUACRec %s',reqId,JSON.stringify(jobj),ex);
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
                    //console.log('An error occurred while searching for Context:', err)
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
        //console.log("Error in searching data : "+ex);
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
                   // console.log('An error occurred while searching for Context:', err)
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

                    //console.log(jarr);


                    resz.write(jarr);
                    //resz=jarr;

                    resz.end();


                }
            });
    }
    catch (ex)
    {
        //console.log("Error in searching data : "+ex);
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