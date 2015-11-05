/**
 * Created by Pawan on 8/7/2015.
 */

var Chance = require('chance');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var nodeUuid = require('node-uuid');
var DbConn = require('dvp-dbmodels');
var EndPoint=require('./EndpointManagement.js');
var mysql = require('mysql');
var config = require('config');

var AddOrUpdateLbUser = function(reqId, usrInfo, callback)
{
    try
    {
        var connection = mysql.createConnection({
            host     : config.Kamailio.Host,
            port     : config.Kamailio.Port,
            user     : config.Kamailio.User,
            password : config.Kamailio.Password,
            database : config.Kamailio.Database
        });

        connection.connect();

        //check username exists

        connection.query('SELECT * FROM subscriber WHERE username = "' + usrInfo.SipUsername + '"', function(err, rows)
        {
            if (err)
            {
                connection.end();
                logger.error('[DVP-PBXService.AddOrUpdateLbUser] - [%s] - MYSQL Update Subscriber', reqId, err);
                callback(err, false);
            }
            else
            {
                if(rows && rows.length > 0)
                {
                    //update

                    connection.query('UPDATE subscriber SET password = "' + usrInfo.Password + '" WHERE username = "' + usrInfo.SipUsername + '"', function(err, resultss)
                    {
                        if (err)
                        {
                            callback(err, false);
                            logger.error('[DVP-PBXService.AddOrUpdateLbUser] - [%s] - MYSQL Update Subscriber', reqId, err);
                            connection.end();
                        }
                        else
                        {
                            callback(undefined, true);
                            connection.end();
                        }
                    });
                }
                else
                {
                    //insert
                    var insertQueryObj  = {username: usrInfo.SipUsername, password: usrInfo.Password, domain: usrInfo.Domain};

                    connection.query('INSERT INTO subscriber SET ?', insertQueryObj, function(err, result)
                    {
                        if (err)
                        {
                            callback(err, false);
                            logger.error('[DVP-PBXService.AddOrUpdateLbUser] - [%s] - MYSQL Update Subscriber', reqId, err);
                            connection.end();
                        }
                        else
                        {
                            callback(undefined, true);
                            connection.end();
                        }
                    });
                }
            }
        });

    }
    catch(ex)
    {
        logger.error('[DVP-PBXService.AddOrUpdateLbUser] - [%s] - MYSQL Update Subscriber', reqId, ex);
        callback(ex, false);

    }
}

var UpdatePublicUser = function(reqId, publicUserInfo, callback)
{
    try
    {
        var chance = new Chance();
        DbConn.SipUACEndpoint.find({where: [{SipUsername: publicUserInfo.SipUsername}]}).then(function (sipUsr)
        {
            if(sipUsr)
            {
                //check for company tenant

                if(publicUserInfo.CompanyId === sipUsr.CompanyId && publicUserInfo.TenantId === sipUsr.TenantId)
                {
                    //ok to update

                    AddOrUpdateLbUser(reqId, publicUserInfo, function(err, rslt)
                    {

                        delete publicUserInfo.CompanyId;
                        delete publicUserInfo.TenantId;
                        delete publicUserInfo.SipUserUuid;
                        delete publicUserInfo.SipUsername;
                        delete publicUserInfo.SipExtension;
                        delete publicUserInfo.TryCount;

                        sipUsr.updateAttributes(publicUserInfo).then(function(updateResult)
                        {
                            logger.debug('[DVP-PBXService.UpdatePbxUserDB] - [%s] - PGSQL Update PBX User query success', reqId);
                            callback(undefined, true);

                        }).catch(function(err)
                        {
                            logger.error('[DVP-PBXService.UpdatePbxUserDB] - [%s] - PGSQL Update Pbx User Failed', reqId, err);
                            callback(err, false);
                        })

                    });

                }
                else
                {
                    //cannot update another record
                    logger.error('[DVP-SIPUserEndpointService.UpdatePublicUser] - [%s] - Cannot update a user belonging to a different company', reqId);
                    callback(new Error('Cannot update a user belonging to a different company'), undefined);
                }

            }
            else
            {
                //save new user

                AddOrUpdateLbUser(reqId, publicUserInfo, function(err)
                {

                });

                logger.debug('[DVP-SIPUserEndpointService.UpdatePublicUser] - [%s] - Get Did Number PGSQL query success', reqId);
                //save ok
                var sipUac = DbConn.SipUACEndpoint.build({
                    SipUserUuid: nodeUuid.v1(),
                    SipUsername: publicUserInfo.SipUsername,
                    Password: publicUserInfo.Password,
                    Enabled: true,
                    ExtraData: publicUserInfo.ExtraData,
                    EmailAddress: publicUserInfo.EmailAddress,
                    GuRefId: publicUserInfo.GuRefId,
                    CompanyId: 1,
                    TenantId: 1,
                    ObjClass: '',
                    ObjType: '',
                    ObjCategory: '',
                    Pin: chance.zip(),
                    PinGenTime: new Date(),
                    TryCount: 0,
                    UsePublic: true,
                    TransInternalEnable: false,
                    TransExternalEnable: false,
                    TransConferenceEnable: false,
                    TransGroupEnable: false
                });

                sipUac
                    .save()
                    .then(function (saveRes)
                    {
                        callback(undefined, saveRes);

                    }).catch(function(err)
                    {
                        logger.error('[DVP-SIPUserEndpointService.UpdatePublicUser] - [%s] - PGSQL query failed', reqId, err);
                        callback(err, undefined);
                    })
            }

        }).catch(function(err)
        {
            logger.error('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - Get Did Number PGSQL query failed', reqId, err);
            callback(err, undefined);
        });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AddDidNumber] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }
};


function AddPublicUser(req,reqId,callback)
{

    logger.debug('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] - Public user adding started Username -  %s ',reqId,req.SipUsername);
    try
    {
        var chance = new Chance();

        var User=req.AreaCode.concat(req.Phone);

        ValidateUserName(User, reqId,function(errValid,resValid)
        {
            if(errValid)
            {
                callback(errValid,undefined);
            }
            else
            {
                CloudEnduserDetails(reqId,function(errCloud,resCloud)
                {
                    if(errCloud)
                    {
                        callback(errCloud,undefined);
                    }
                    else
                    {
                        try
                        {
                            var Company=resCloud.CloudEndUser[0].CompanyId;
                            var Tenant=resCloud.CloudEndUser[0].TenantId;
                        }
                        catch(ex)
                        {

                            callback(ex,undefined);
                        }


                        var sipUserUuid = nodeUuid.v1();
                        var NowDt=new Date();
                        console.log(NowDt);

                        if(EndPoint.PhoneNumberValidation(User))
                        {

                            var SIPObject = DbConn.SipUACEndpoint
                                .build(
                                {
                                    SipUserUuid: sipUserUuid,
                                    SipUsername: User,
                                    Password: req.Password,
                                    Enabled: true,
                                    ExtraData: req.ExtraData,
                                    EmailAddress: req.EmailAddress,
                                    GuRefId: req.GuRefId,
                                    CompanyId: Company,
                                    TenantId: Tenant,
                                    ObjClass: "",
                                    ObjType: "",
                                    ObjCategory: "",
                                    AddUser: req.AddUser,
                                    Pin:chance.zip(),
                                    PinGenTime:NowDt,
                                    TryCount:0,
                                    UpdateUser: req.UpdateUser,
                                    UserPublic: false
                                }
                            );

                            SIPObject.save().then(function (resSave) {

                                logger.debug('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] - Public user added successfully ',reqId,req.SipUsername);
                                callback(undefined,resSave);

                            }).catch(function (errSave) {
                                logger.error('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] - [PGSQL] - Error in inserting Public Sip user records',reqId,errSave);
                                callback(errSave, undefined);
                            });

                        }
                        else
                        {
                            logger.error('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] - [PGSQL] - Invalid Username %s',reqId,User);
                            callback(new Error("Invalid Username "), undefined);
                        }


                    }
                });
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] - [PGSQL] - Add Public user method Exception',reqId,ex);
        callback(ex, undefined);
    }


}

function CloudEnduserDetails(reqId,callback)
{
    logger.debug('[DVP-SIPUserEndpointService.CloudEnduserDetails] - [%s] - Searching for Cloud End-user Details ',reqId);
    try
    {
        DbConn.Cloud.find({where :[{Type: 'PUBLIC'}], include: [{model: DbConn.CloudEndUser, as: "CloudEndUser"}]}).then(function(resCloud)
        {
            logger.debug('[DVP-SIPUserEndpointService.CloudEnduserDetails] - [%s] - Public CloudEndUser details found',reqId);
            callback(undefined,resCloud);

        }).catch(function(errCloud)
        {
            logger.error('[DVP-SIPUserEndpointService.CloudEnduserDetails] - [%s] - Public CloudEndUser details searching error',reqId,errCloud);
            callback(errCloud,undefined);
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.CloudEnduserDetails] - [%s] - Public CloudEndUser details searching Exception',reqId,ex);
        callback(ex,undefined);
    }

}

function ValidateUserName(Usname,reqId,callback)
{

    logger.debug('[DVP-SIPUserEndpointService.ValidateUserName] - [%s] - Searching for Existing UserNames ',reqId);

    try
    {
        DbConn.SipUACEndpoint.find({where:[{SipUsername:Usname}]}).then(function(resUser)
        {
            if(!resUser)
            {
                logger.debug('[DVP-SIPUserEndpointService.ValidateUserName] - [%s] - Valid Username %s ',reqId,Usname);
                callback(undefined,resUser);
            }
            else
            {
                logger.error('[DVP-SIPUserEndpointService.ValidateUserName] - [%s] -  Username %s already taken ',reqId,Usname);
                callback(new Error("Given Username is already taken"),undefined);
            }

        }).catch(function(errUser)
        {
            logger.error('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] -  Error in searching Username %s ',reqId,Usname,errUser);
            callback(errUser,undefined);

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.ValidateUserName] - [%s] -  Exception in searching Username %s ',reqId,Usname,ex);
        callback(ex,undefined);
    }
}

function ActivatePublicUser(Usname,Pin,reqId,callback)
{
    logger.debug('[DVP-SIPUserEndpointService.ActivatePublicUser] - [%s] - Searching for Existing UserNames ',reqId);

    try
    {
        DbConn.SipUACEndpoint.find({where:[{SipUsername:Usname}]}).then(function(resUser)
        {
            if(!resUser)
            {
                logger.debug('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] - [PGSQL] - Valid Username %s ',reqId,Usname);
                callback(new Error("No User found"),undefined)
            }
            else
            {
                logger.error('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] - [PGSQL]  -  Username %s is Valid ',reqId,Usname);
                if(Pin==resUser.Pin && resUser.TryCount<3)
                {

                    DbConn.SipUACEndpoint
                        .update(
                        {
                            TryCount: 0,
                            UsePublic: true
                        },
                        {
                            where: [{SipUsername: Usname}, {Pin: resUser.Pin}]
                        }
                    ).then(function(resValid)
                        {

                            logger.debug('[DVP-LimitHandler.ActivatePublicUser] - [%s] - [PGSQL]  - Valid PIN %s for User %s ',reqId,resUser.Pin,Usname);
                            callback(undefined, resValid);

                        }).catch(function(errValid)
                        {
                            logger.error('[DVP-LimitHandler.UACManagement.ActivatePublicUser] - [%s] - [PGSQL]  - Error Activating user',reqId,errValid);
                            callback(errValid, undefined);
                        });

                }
                else
                {
                    if(resUser.TryCount>=3)
                    {
                        callback(new Error("Pin Expired,Request new one"),undefined);
                    }
                    else
                    {
                        var NewTryCount=resUser.TryCount+1;

                        DbConn.SipUACEndpoint
                            .update(
                            {
                                TryCount: NewTryCount
                            },
                            {
                                where: [{SipUsername: Usname}, {Pin: resUser.Pin}]
                            }
                        ).then(function (resInvalid) {

                                logger.debug('[DVP-LimitHandler.ActivatePublicUser] - [%s] - [PGSQL]  - Invalid PIN And You have retry ',reqId,Usname);
                                callback(new Error("Invalid Pin,Try Again"), resInvalid);

                            }).catch(function (errInvalid) {


                                logger.error('[DVP-LimitHandler.UACManagement.ActivatePublicUser] - [%s] - [PGSQL]  - Error increasing TryCount',reqId,errInvalid);
                                callback(errInvalid, undefined);

                            });
                    }


                }


            }

        }).catch(function(errUser)
        {
            logger.error('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] -  Error in searching Username %s ',reqId,Usname,errUser);
            callback(errUser,undefined);

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.AddPublicUser] - [%s] -  Exception in searching Username %s ',reqId,Usname,ex);
        callback(ex,undefined);
    }




}

function PinOfUser(Usnm,reqId,callback)
{
    logger.debug('[DVP-SIPUserEndpointService.PinOfUser] - [%s] - Searching pin of %s ',reqId,Usnm);
    try
    {

        ValidateUserName(Usnm,reqId,function(errUser,resUser)
        {
            if(errUser)
            {
                callback(errUser,undefined);
            }
            else
            {
                callback(undefined,resUser.Pin);
            }
        })
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.PinOfUser] - [%s] - Exception occur Searching pin of %s ',reqId,Usnm,ex);
        callback(ex,undefined);
    }
}

function ReGeneratePin(Usnm,reqId,callback)
{
    var chance = new Chance();
    logger.debug('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] -Pin ReGenerating of %s started ',reqId,Usnm);

        DbConn.SipUACEndpoint.find({where:[{SipUsername:Usnm}]}).then(function(resUser)
        {
            if(resUser )
            {
                logger.debug('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] - [PGSQL] - User record  %s Found ',reqId,Usnm);
                if(resUser.TryCount>=3)
                {

                    var NewPin=chance.zip();
                    ResetPin(Usnm,NewPin,reqId,function(errPin,resPin)
                    {
                        if(errPin)
                        {
                            callback(errPin,undefined);
                        }
                        else
                        {
                            ResetAttempts(Usnm,reqId,function(errAtmpt,resAtmpt)
                            {
                                if(errAtmpt)
                                {
                                    callback(errAtmpt,undefined);
                                }
                                else
                                {
                                    callback(undefined,NewPin);
                                }
                            });
                        }
                    });



                }
                else
                {
                    ResetAttempts(Usnm,reqId,function(errAtmpt,resAtmpt)
                    {
                        if(errAtmpt)
                        {
                            callback(errAtmpt,undefined);
                        }
                        else
                        {
                            callback(undefined,resUser.Pin);
                        }
                    });

                }
            }
            else
            {
                logger.error('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] - [PGSQL] - User record  %s not Found ',reqId,Usnm);
                callback(new Error("No User found"),undefined);
            }

        }).catch(function(errUser)
        {
            logger.error('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] - [PGSQL] -  Searching User record  %s failed ',reqId,Usnm,errUser);
            callback(errUser,undefined);
        });





}

function ResetAttempts(Usnm,reqId,callback)
{
    logger.debug('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] - Attempt resetting of %s started ',reqId,Usnm);
    try
    {
        DbConn.SipUACEndpoint
            .update(
            {
                TryCount: 0

            },
            {
                where: [{SipUsername: Usnm}, {Pin: resUser.Pin}]

            }).then(function(resUpdate)
            {
                logger.debug('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] - [PGSQL] - Attempt resetting of %s Succeeded  ',reqId,Usnm);
                callback(resUpdate,undefined);
            }).catch(function(errUpdate)
            {
                logger.debug('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] - [PGSQL] - Attempt resetting of %s failed  ',reqId,Usnm,errUpdate);
                callback(errUpdate,undefined);
            })
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.ResetAttempts] - [%s] - Exception in Attempt resetting of %s ',reqId,Usnm,ex);
        callback(ex,undefined);
    }
}

function ResetPin(Usnm,Pin,reqId,callback)
{
    logger.debug('[DVP-SIPUserEndpointService.ResetPin] - [%s] - Pin resetting of %s',reqId,Usnm);
    try
    {
        DbConn.SipUACEndpoint
            .update(
            {
                Pin: Pin

            },
            {
                where: [{SipUsername: Usnm}]

            }).then(function(resUpdate)
            {
                logger.debug('[DVP-SIPUserEndpointService.ResetPin] - [%s] - [PGSQL] - Pin resetting of %s Succeeded ',reqId,Usnm);
                callback(resUpdate,undefined);
            }).catch(function(errUpdate)
            {
                logger.error('[DVP-SIPUserEndpointService.ResetPin] - [%s] - [PGSQL] - Pin resetting of %s failed ',reqId,Usnm,errUpdate);
                callback(errUpdate,undefined);
            })
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.ResetPin] - [%s] - Exception in Pin resetting of %s ',reqId,Usnm,ex);
        callback(ex,undefined);
    }
}



module.exports.AddPublicUser = AddPublicUser;
module.exports.ActivatePublicUser = ActivatePublicUser;
module.exports.PinOfUser = PinOfUser;
module.exports.ReGeneratePin = ReGeneratePin;
module.exports.UpdatePublicUser = UpdatePublicUser;
