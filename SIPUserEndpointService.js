/**
 * Created by Administrator on 1/27/2015.
 */
//C:\DVP\DVP-SIPUsersEndpointService\DVP-Common\CSORMModels\CsDataModel.js

var DbConn = require('./DVP-DBModels');
var DbSave=require('./SaveSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


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
function PostFunc(reqz,resz,errz) {
    logger.info('Context Management is Starting.');


    try {
        var obj = reqz.body;
        logger.info('Request : ' + obj);

        //Add other vars to object

        obj.CompanyId = 1;
        obj.TenantId = 2;
        obj.AddUser = "NAddUser";
        obj.UpdateUser = "NUpdateUser";
        obj.AddTime = new Date(2013, 01, 13);
        obj.UpdateTime = new Date(2013, 01, 28);
        logger.info('After Object updation : ' + obj);
    }
    catch (ex) {
        console.log("Error in adding new items to object created using request body");
        logger.info('Exception found in object creation : ' + ex);
        var jsonString = messageFormatter.FormatMessage(errz, "ERROR", false, null);
        resz.end(jsonString);

    }


    logger.info('Searching for record , Context :' + obj.Context);


    try
    {
        DbConn.Context
            .find({where: {Context: obj.Context}})
            .complete(function (err, result) {
                if (!!err) {
                    console.log('An error occurred while searching for Context:', err);

                    logger.info('Error found in Searching , Context :' + obj.Context + ' Error : ' + err);
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    resz.end(jsonString);

                } else if (!result) {
                    console.log('No user with the Context ' + obj.Context + ' has been found.');
                    logger.info('No record Found , Context :' + obj.Context);

                    try {

                        logger.info('Entering new record for Context :' + obj.Context);
                        DbConn.Context
                            .create(
                            {
                                Context: obj.Context,
                                Description: obj.Description,
                                // ContextCat: Sequelize.STRING,
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
                                if (err == null) {
                                    console.log("New User Found and Inserted (Context : " + obj.Context + ")");
                                    logger.info('Record inserted');
                                    var jsonString = messageFormatter.FormatMessage(err, null, true, user);
                                    resz.end(jsonString);

                                    // callback(err, true);
                                    // pass null and true


                                }
                                else {
                                    console.log("Error in saving  (Context :" + obj.Context + ")" + err);
                                    logger.info('Error in saving , Context :' + obj.Context);
                                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, user);
                                    resz.end(jsonString);
                                    //   callback(err, false);
                                    //pass error and false
                                }
                            });


                    }
                    catch (ex) {
                        console.log("An error occurred in data saving process ");
                        logger.info('Exception Found in saving , Exception :' + ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, user);
                        resz.end(jsonString);

                    }

                } else {
                    console.log('Context Found ' + result.Context + '!');
                    console.log('All attributes of Context:', result.values);
                    logger.info('Record is already in db  :' + obj.Context);

                    try {
                        DbConn.Context
                            .update(
                            {
                                Description: obj.Description,
                                // ContextCat: Sequelize.STRING,
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
                                logger.info('Record Updated Successfully');
                                var jsonString = messageFormatter.FormatMessage(ex, null, true, results);
                                resz.end(jsonString);

                            }).error(function (err) {

                                console.log("Project update failed !");
                                logger.info('Record Updation failed : ' + err);
                                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, results);
                                resz.end(jsonString);
                                //handle error here

                            });
                    }
                    catch (ex) {
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
                        resz.end(jsonString);
                    }

                }
            });

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, obj);
        resz.end(jsonString);
    }

}

//get :- done
function GetFunc(reqz,resz,errz)
{
    try {

        DbConn.Context
            // .find({ where: { Context: req.params.context } })
            .findAll({where: {CompanyId: reqz}})
            .complete(function (err, result) {

                if (!!err) {
                    console.log('An error occurred while searching for Context:', err);
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                    resz.end(jsonString);

                } else if (result.length==0) {

                    var jsonString = messageFormatter.FormatMessage(err, "EMPTY", true, result);
                    resz.end(jsonString);
                }
                else {

                    try {


                        var Jresults = JSON.stringify(result);

                        var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                        resz.end(jsonString);

                    }
                    catch (ex)
                    {
                        console.log("Error in creating json object to return : "+ex);
                        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, result);
                        resz.end(jsonString);
                    }

                    // set as Json Object

                }
            });
    }
    catch (ex)
    {
        console.log("Error in searching data : "+ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        resz.end(jsonString);

    }

}



module.exports.PostFunc = PostFunc;
module.exports.GetFunc = GetFunc;

