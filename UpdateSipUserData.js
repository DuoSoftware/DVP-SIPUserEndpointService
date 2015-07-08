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
function UpdateUser(Username,jobj,reqId,callback) {

    if(jobj)
    {
        try{
            DbConn.SipUACEndpoint
                .find({where: [{SipUsername: Username}, {CompanyId: 1}, {TenantId: 1}]})
                .complete(function (err, result) {
                    if (err) {
                        logger.error('[DVP-LimitSIPUserEndpointServiceHandler.UpdateUser] - [%s] - [PGSQL]  - Error in searching SipUser %s',reqId,jobj.SipUsername,err);
                        callback(err, undefined);

                    } else
                    {
                        if (!result) {

                            logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - No record found for SipUser %s ',reqId,jobj.SipUsername);
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
                                        where: [{SipUsername: Username}, {CompanyId: 1}, {TenantId: 1}]
                                    }
                                ).then(function (resultUpdate) {

                                        logger.debug('[DVP-LimitHandler.UACManagement.UpdateUser] - [%s] - [PGSQL]  - Updating records of SipUser %s is succeeded ',reqId,jobj.SipUsername);
                                        callback(undefined, resultUpdate);

                                    }).error(function (errUpdate) {

                                        console.log("Project update failed ! " + errUpdate);
                                        logger.error('[DVP-LimitHandler.UACManagement.UpdateUser] - [%s] - [PGSQL]  - Updating records of SipUser %s is failed - Data %s ',reqId,jobj.SipUsername,JSON.stringify(jobj),errUpdate);
                                        callback(errUpdate, undefined);

                                    });

                            }
                            catch (ex) {
                                logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - Exception in updating SipUser %s ',reqId,jobj.SipUsername,ex);
                                callback(ex, undefined);
                            }
                        }

                    }
                });
        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - Exception in Method starts : UpdateUser ',reqId,jobj.SipUsername,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        callback(new Error("Empty request"),undefined);
    }


}

function PickCompanyUsers(Company,reqId,callback)
{
    try
    {
        DbConn.SipUACEndpoint
            .findAll({where: {CompanyId: Company}})
            .complete(function (errSip, resSip) {

                if (errSip) {
                    logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Error in searching SipUser of Company %s ',reqId,Company,errSip);
                    callback(errSip, undefined);

                } else
                {

                    if (!resSip) {

                        logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - No record found for SipUser of Company %s ',reqId,Company);
                        callback(new Error("No SipUSer record found"), undefined);
                    }
                    else {

                        logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Record found for Context %s ',reqId,Company);
                        callback(undefined, resSip);


                    }



                }


            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Exception in starting method:  ',reqId,ex);
        callback(ex, undefined);
    }
}



//exporting module
module.exports.UpdateUser = UpdateUser;
module.exports.PickCompanyUsers = PickCompanyUsers;
