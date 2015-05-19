/**
 * Created by Administrator on 1/27/2015.
 */
//C:\DVP\DVP-SIPUsersEndpointService\DVP-Common\CSORMModels\CsDataModel.js

var DbConn = require('DVP-DBModels');
var DbSave=require('./SaveSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;


var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './ContextMgtLog.log' })

    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './ContextMgtLogErr.log' })
    ]
});







//Post
//Request comes as body

//post :- done

function AddOrUpdateContext(reqz,reqId,callback) {
   // logger.info('Context Management is Starting.');


    try {
        var obj = reqz.body;
        //logger.info('Request : ' + obj);


        //Add other vars to object

        obj.CompanyId = 1;
        obj.TenantId = 5;
        obj.AddUser = "NAddUser";
        obj.UpdateUser = "NUpdateUser";
        obj.AddTime = new Date(2013, 01, 13);
        obj.UpdateTime = new Date(2013, 01, 28);
        //logger.info('After Object updation : ' + obj);
    }
    catch (ex) {
        //console.log("Error in adding new items to object created using request body");
        //logger.info('Exception found in object creation : ' + ex);

        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);

        callback("Exception",undefined)
        //resz.end(jsonString);

    }


    //logger.info('Searching for record , Context :' + obj.Context);

    if(obj.Context) {
        try {
            DbConn.Context
                .find({where: {Context: obj.Context}})
                .complete(function (err, result) {
                    if (err) {
                        console.log('An error occurred while searching for Context:', err);

                       // logger.info('Error found in Searching , Context :' + obj.Context + ' Error : ' + err);
                        logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Error occurred while searching Context %s ',reqId,obj.Context,err);
                        var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                        callback("Error", undefined);

                    }

                    else
                    {
                        if (!result) {
                            console.log('No user with the Context ' + obj.Context + ' has been found.');
                            logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - No record found for Context %s ',reqId,obj.Context);

                            try {

                                logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Creating new record of Context %s ',reqId,obj.Context);
                                DbConn.Context
                                    .create(
                                    {
                                        Context: obj.Context,
                                        Description: obj.Description,
                                        ContextCat: obj.ContextCat,
                                        CompanyId: obj.CompanyId,
                                        TenantId: obj.TenantId,
                                        ObjClass: obj.ObjClass,
                                        ObjType: obj.ObjType,
                                        ObjCategory: obj.ObjCategory,
                                        AddUser: obj.AddUser,
                                        UpdateUser: obj.UpdateUser
                                        // AddTime: jobj.AddTime,
                                        // UpdateTime: jobj.UpdateTime,
                                        //id: 1,
                                        // createdAt: new Date(2009, 10, 11),
                                        // updatedAt: new Date(2009, 10, 12)

                                    }
                                ).complete(function (err, user) {
                                        /* ... */
                                        if (!err ) {
                                            console.log("New User Found and Inserted (Context : " + obj.Context + ")");
                                            //logger.info('Record inserted');
                                            logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s inserted successfully - Data %s',reqId,obj.Context,JSON.stringify(obj));
                                            var jsonString = messageFormatter.FormatMessage(err, null, true, user);
                                            callback(undefined, user);


                                        }
                                        else {
                                            console.log("Error in saving  (Context :" + obj.Context + ")" + err);
                                            logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s insertion  failed - Data %s',reqId,obj.Context,JSON.stringify(obj),err);
                                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, user);
                                            callback("Error", undefined);
                                            //   callback(err, false);
                                            //pass error and false
                                        }
                                    });


                            }
                            catch (ex) {
                                console.log("An error occurred in data saving process ");
                                logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s]  - Exception in detail creation of Context %s',reqId,obj.Context,ex);
                                var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, user);
                                callback("Exception", undefined);

                            }

                        } else {
                            console.log('Context Found ' + result.Context + '!');
                            console.log('All attributes of Context:', result.values);
                            logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s]  - Context found',reqId,JSON.stringify(result));

                            try {
                                logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s]  - Updating picked Context data %s to %s',reqId,JSON.stringify(result),JSON.stringify(obj));
                                DbConn.Context
                                    .update(
                                    {
                                        Description: obj.Description,
                                        ContextCat: obj.ContextCat,
                                        CompanyId: obj.CompanyId,
                                        TenantId: obj.TenantId,
                                        ObjClass: obj.ObjClass,
                                        ObjType: obj.ObjType,
                                        ObjCategory: obj.ObjCategory,
                                        AddUser: obj.AddUser,
                                        UpdateUser: obj.UpdateUser
                                        //  AddDate:obj.AddTime,
                                        // UpdateDate: obj.UpdateTime,
                                        // createdAt:new Date(2009,10,11),
                                        //updatedAt:new Date(2009,10,12)
                                    },
                                    {
                                        where: {
                                            Context: obj.Context
                                        }
                                    }
                                ).then(function (results) {

                                        console.log("Updated successfully!");
                                        logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s Updated successfully',reqId,obj.Context);
                                        var jsonString = messageFormatter.FormatMessage(null, "Successfully Updated", true, results);
                                        callback(undefined, results);

                                    }).error(function (err) {

                                        console.log("Project update failed !");
                                        logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Context %s Updation failed',reqId,obj.Context,err);
                                        var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, null);
                                        callback("Error", undefined);
                                        //handle error here

                                    });
                            }
                            catch (ex) {
                                logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Exception in updating context %s',reqId,obj.Context,ex);
                                var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
                                callback("Exception", undefined);
                            }

                        }

                    }
                });

        }
        catch (ex) {
            logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Exception in Searching context %s',reqId,obj.Context,ex);
            var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
            callback("Exception",undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [PGSQL] - Recieved Context id is invalid',reqId);
        var jsonString = messageFormatter.FormatMessage(null, "Null value passed for Context", false, obj);
        callback(undefined,obj.Context);
    }
}

//get :- done
function GetContextDetails(reqz,reqId,callback)
{
    try {

        DbConn.Context
            // .find({ where: { Context: req.params.context } })
            .findAll({where: {CompanyId: reqz}})
            .complete(function (err, result) {

                if (err) {
                    //console.log('An error occurred while searching for Context:', err);
                    logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - Error in searching Context %s ',reqId,reqz,err);
                    var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for Context for Company :" + reqz, false, result);
                    callback(null, jsonString);

                } else
                {

                    if (!result) {

                        logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - No record found for Context %s ',reqId,reqz);
                        var jsonString = messageFormatter.FormatMessage(err, "No context for company :" + reqz, true, result);
                        callback(undefined, undefined);
                    }
                    else {

                        try {


                            var Jresults = JSON.stringify(result);

                            logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [PGSQL]  - Record found for Context %s Data %s',reqId,reqz,Jresults);
                            // var jsonString = messageFormatter.FormatMessage(err, "Successfully json returned", true, result);
                            callback(undefined, Jresults);

                        }
                        catch (ex) {
                            //console.log("Error in creating json object to return : " + ex);
                           // logger.error('[DVP-LimitHandler.UACManagement.FindContextByCompany] - [%s] - [PGSQL]  - Exception in Record found for Context %s Data %s',reqId,reqz,Jresults);
                           // logger.debug('[DVP-LimitHandler.UACManagement.FindContextByCompany] - [%s] - [PGSQL]  - Record found for Context %s Data %s',reqId,reqz,Jresults);
                            var jsonString = messageFormatter.FormatMessage(ex, "Exception found in json creating .", false, result);
                            callback("Exception", undefined);
                        }

                        // set as Json Object

                    }

                }
            });
    }
    catch (ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Exception in starting method : GetContextDetails  Context %s ',reqId,reqz);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception in calling function", false, null);
        callback("Exception",undefined);

    }

}

module.exports.AddOrUpdateContext = AddOrUpdateContext;
module.exports.GetContextDetails = GetContextDetails;

