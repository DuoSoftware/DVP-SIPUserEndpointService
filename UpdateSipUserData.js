/**
 * Created by pawan on 2/9/2015.
 */

/**
 * Created by pawan on 2/2/2015.
 */

/**
 * Created by Administrator on 1/27/2015.
 */
var DbConn = require('DVP-DBModels');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;

//var SaveNewSipUser=function(UContext,UDescription,UCompanyId,UTenantId,UObjClass,UObjType,UObjCategory,UAddUser,UUpdateUser,UAddTime,UUpdateTime,callback)

// Save function , 2 params, object from caller and this functions callback

// post :- done
function UpdateUacUserData(Username,jobj,reqId,callback) {
    // Add all  details of new user
try{
    DbConn.SipUACEndpoint
        .find({where: [{SipUsername: Username}, {CompanyId: 1}, {TenantId: 1}]})
        .complete(function (err, result) {
            if (err) {
                //console.log('................An error occurred while searching for SIp UAC Record..................', err);
                logger.error('[DVP-LimitSIPUserEndpointServiceHandler.UpdateUAC] - [%s] - [PGSQL]  - Error in searching SipUser %s',reqId,jobj.SipUsername,err);
                ////var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                callback(err, undefined);

            } else
            {
                if (!result) {


                console.log('No user has been found.');
                    logger.error('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - [PGSQL]  - No record found for SipUser %s ',reqId,jobj.SipUsername);
                var jsonString = messageFormatter.FormatMessage(err, "No record found", false, null);
                    callback(new Error("No SipUser record found"), undefined);

            }
            else {

                try {

                    DbConn.SipUACEndpoint
                        .update(
                        {
                            Password: jobj.Password,
                            GuRefId: jobj.GuRefId,
                            ObjClass: "OBJCLZ",
                            ObjType: "OBJTYP",
                            ObjCategory: "OBJCAT",
                            ExtraData: jobj.ExtraData

                        },
                        {
                            where: [{SipUsername: Username}, {CompanyId: jobj.CompanyId}, {TenantId: jobj.TenantId}]
                        }
                    ).then(function (resultz) {

                            //console.log(".......................Record updated successfully!....................");
                            logger.debug('[DVP-LimitHandler.UACManagement.UpdateUAC] - [%s] - [PGSQL]  - Updating records of SipUser %s is succeeded ',reqId,jobj.SipUsername);
                            //var jsonString = messageFormatter.FormatMessage(err, "Record updated successfully", true, result);
                            callback(undefined, resultz);

                        }).error(function (errz) {

                            console.log("Project update failed ! " + errz);
                            logger.error('[DVP-LimitHandler.UACManagement.UpdateUAC] - [%s] - [PGSQL]  - Updating records of SipUser %s is failed - Data %s ',reqId,jobj.SipUsername,JSON.stringify(jobj),errz);
                            //var jsonString = messageFormatter.FormatMessage(err, "SipUAC rec update failed", false, result);
                            callback(errz, undefined);
                            //handle error here

                        });

                }
                catch (ex) {
                    logger.error('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - [PGSQL]  - Exception in updating SipUser %s ',reqId,jobj.SipUsername,ex);
                    //var jsonString = messageFormatter.FormatMessage(ex, "Exception in updation", false, null);
                    callback(ex, undefined);
                }
            }

        }
        });
    //return next();
}
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - [PGSQL]  - Exception in Method starts : UpdateUacUserData ',reqId,jobj.SipUsername,ex);
        //var jsonString = messageFormatter.FormatMessage(ex, "Exception in function starts", false, null);
        callback(ex, undefined);
    }
}

function GetSIPUsersOfCompany(reqz,reqId,callback)
{
    try
    {
        DbConn.SipUACEndpoint
            // .find({ where: { Context: req.params.context } })
            .findAll({where: {CompanyId: reqz}})
            .complete(function (err, result) {

                if (err) {
                    //console.log('An error occurred while searching for Context:', err);
                    logger.error('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - [PGSQL]  - Error in searching SipUser of Company %s ',reqId,reqz,err);
                    //var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for Context for Company :" + reqz, false, result);
                    callback(err, undefined);

                } else
                {

                    if (!result) {

                        logger.error('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - [PGSQL]  - No record found for SipUser of Company %s ',reqId,reqz);
                        //var jsonString = messageFormatter.FormatMessage(err, "No context for company :" + reqz, true, result);
                        callback(new Error("No SipUSer record found"), undefined);
                    }
                    else {




                        // var Jresults = JSON.stringify(result);

                        logger.debug('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - [PGSQL]  - Record found for Context %s ',reqId,reqz);
                        // var jsonString = messageFormatter.FormatMessage(err, "Successfully json returned", true, result);
                        callback(undefined, result);



                    }

                    // set as Json Object

                }


            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - [PGSQL]  - Exception in starting method:  ',reqId,ex);
        //var jsonString = messageFormatter.FormatMessage(err, "An error occurred while searching for Context for Company :" + reqz, false, result);
        callback(ex, undefined);
    }
}



//exporting module
module.exports.UpdateUacUserData = UpdateUacUserData;
module.exports.GetSIPUsersOfCompany = GetSIPUsersOfCompany;
