/**
 * Created by Pawan on 11/9/2015.
 */
var DbConn = require('dvp-dbmodels');
var messageFormatter = require('dvp-common-lite/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('dvp-common-lite/LogHandler/CommonLogHandler.js').logger;
var nodeUuid = require('node-uuid');
var redisCacheHandler = require('dvp-common/CSConfigRedisCaching/RedisHandler.js');
var organization = require('dvp-mongomodels/model/Organisation');
var redisClient = require('./RedisHandler').redisClient;
var Redlock = require('redlock');
var _ = require('lodash');
var auditTrailsHandler = require('dvp-common/AuditTrail/AuditTrailsHandler.js');

var rlock = new Redlock(
    [redisClient],
    {
        driftFactor: 0.01,

        retryCount: 10000,

        retryDelay: 200

    }
);

rlock.on('clientError', function(err)
{
    logger.error('[DVP-Common.AcquireLock] - [%s] - REDIS LOCK FAILED', err);

});


function addAuditTrail(tenantId, companyId, iss, auditData) {
    /*var auditData =  {
     KeyProperty: keyProperty,
     OldValue: auditTrails.OldValue,
     NewValue: auditTrails.NewValue,
     Description: auditTrails.Description,
     Author: auditTrails.Author,
     User: iss,
     OtherData: auditTrails.OtherData,
     ObjectType: auditTrails.ObjectType,
     Action: auditTrails.Action,
     Application: auditTrails.Application,
     TenantId: tenantId,
     CompanyId: companyId
     }*/

    try {
        auditTrailsHandler.CreateAuditTrails(tenantId, companyId, iss, auditData, function (err, obj) {
            if (err) {
                var jsonString = messageFormatter.FormatMessage(err, "Fail", false, auditData);
                logger.error('addAuditTrail -  Fail To Save Audit trail-[%s]', jsonString);
            }
        });
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "Fail", false, auditData);
        logger.error('addAuditTrail -  insertion  failed-[%s]', jsonString);
    }
}

//Sipuser
function CreateUser(req,Company,Tenant,reqId,iss,callback) {


    logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Searching for SipUACEndPoint %s ',reqId,req.SipUsername);

    if(req.body)
    {
        try
        {
            var SipObj = req.body;
        }
        catch (ex)
        {

            logger.error('[DVP-SIPUserEndpointService.CreateUser] - error occurred while getting request body for SipUACEndPoint  ',reqId,req.body,errUser);
            callback(ex,undefined);
        }

        if(SipObj.SipUsername)
        {

            try
            {
                DbConn.SipUACEndpoint
                    .find({where: [{SipUsername: SipObj.SipUsername}, {CompanyId: Company}, {TenantId: Tenant}]})
                    .then(function (resUser) {
                        if(!resUser)
                        {
                            logger.debug('[DVP-SIPUserEndpointService.CreateUser] - [%s] - No record found for SipUACEndPoint %s ',reqId,SipObj.SipUsername);
                            try
                            {
                                SaveUser(SipObj,Company,Tenant,reqId,req.user.iss,function (error, st)
                                {

                                    if(error)
                                    {
                                        callback(error, null);
                                    }
                                    else
                                    {
                                        if (st)
                                        {

                                            callback(null, st);
                                        }
                                        else
                                        {
                                            callback(new Error("Error occurred"), null);
                                        }
                                    }


                                });


                            }
                            catch (ex) {

                                logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - Exception in saving UAC records',reqId,ex);
                                callback(ex, null);

                            }
                        }
                        else
                        {
                            logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - Found sip user %s',reqId,resUser.SipUsername);
                            callback(new Error("Cannot overwrite this record"), null);
                        }

                    }).catch(function (errUser)
                {
                    logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - error occurred while searching for SipUACEndPoint %s ',reqId,SipObj.SipUsername,errUser);
                    callback(errUser, null);
                });




            }
            catch (ex) {
                logger.error('[DVP-SIPUserEndpointService.CreateUser] - [%s] - [PGSQL] - Exception in starting : SaveSip of %s',reqId,SipObj.SipUsername,ex);
                callback(ex, null);
            }
        }
        else
        {
            callback(new Error("Undefined SipUsername"), null);
        }
    }
    else
    {
        callback(new Error("Empty request"),undefined)
    }



}

function GetEnabledSipUserCount(companyId, tenantId)
{
    return DbConn.SipUACEndpoint.aggregate('*', 'count', {where :[{CompanyId: companyId}, {TenantId: tenantId}, {Enabled: true}]});
}


function SaveUser(jobj,Company,Tenant,reqId,iss,callback) {


    if (jobj)
    {

        logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s]  - Searching Records of CloudEndUser %s ',reqId,jobj.CloudEndUserId);

        if(!isNaN(jobj.CloudEndUserId))
        {
            try
            {
                DbConn.CloudEndUser.find({where: [{id: jobj.CloudEndUserId},{CompanyId:Company},{TenantId:Tenant}]}).then(function(resCloudUser)
                {
                    if (resCloudUser)
                    {

                        if(jobj.ContextId)
                        {
                            try
                            {
                                DbConn.Context.find({where: [{Context: jobj.ContextId},{CompanyId:Company},{TenantId:Tenant}]}).then(function(resContext)
                                {
                                    if (resContext) {

                                        var sipUserUuid = nodeUuid.v1();
                                        logger.debug('[DVP-SIPUserEndpointService.SaveUser] - [%s] - Record found for Context %s and saving SipUser',reqId,jobj.ContextId);
                                        var SIPObject = DbConn.SipUACEndpoint
                                            .build(
                                                {
                                                    SipUserUuid: sipUserUuid,
                                                    SipUsername: jobj.SipUsername,
                                                    Password: jobj.Password,
                                                    Enabled: jobj.Enabled,
                                                    ExtraData: jobj.ExtraData,
                                                    EmailAddress: jobj.EmailAddress,
                                                    GuRefId: jobj.GuRefId,
                                                    Pin:jobj.Pin,
                                                    CompanyId: Company,
                                                    TenantId: Tenant,
                                                    ObjClass: "OBJCLZ",
                                                    ObjType: "CALL",
                                                    ObjCategory: jobj.ObjCategory,
                                                    AddUser: jobj.AddUser,
                                                    UpdateUser: jobj.UpdateUser,
                                                    VoicemailAsEmail: jobj.VoicemailAsEmail,
                                                    TransInternalEnable:jobj.TransInternalEnable,
                                                    TransExternalEnable:jobj.TransExternalEnable,
                                                    TransConferenceEnable:jobj.TransConferenceEnable,
                                                    TransGroupEnable:jobj.TransGroupEnable,
                                                    ContextId: jobj.ContextId,
                                                    DenyOutboundFor: jobj.DenyOutboundFor,
                                                    RecordingEnabled: jobj.RecordingEnabled

                                                }
                                            );

                                        var lockKey = Tenant + '_' + Company + '_' + 'SIPUSER_LIMIT_LOCK';
                                        var ttl = 2000;


                                        rlock.lock(lockKey, ttl).then(function(lock)
                                        {
                                            try
                                            {
                                                organization.findOne({tenant: Tenant, id: Company}, function(err, org)
                                                {
                                                    if(err)
                                                    {
                                                        lock.unlock()
                                                            .catch(function (err)
                                                            {
                                                                logger.error('[DVP-Common.addClusterToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                                                            });
                                                        callback(err, null);
                                                    }
                                                    else
                                                    {
                                                        if(org && org.resourceAccessLimits)
                                                        {
                                                            var userLimits = _.find(org.resourceAccessLimits, {'scopeName': 'sipuser'});

                                                            if(userLimits)
                                                            {
                                                                //allow add user
                                                                DbConn.SipUACEndpoint.aggregate('*', 'count', {where :[{CompanyId: Company}, {TenantId: Tenant}, {Enabled: true}]}).then(function(sipUserCount)
                                                                {
                                                                    if(userLimits.accessLimit > sipUserCount)
                                                                    {
                                                                        SIPObject.save().then(function (resSave)
                                                                        {
                                                                            lock.unlock()
                                                                                .catch(function (err)
                                                                                {
                                                                                    logger.error('[DVP-Common.addClusterToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                                                                                });
                                                                            resCloudUser.addSipUACEndpoint(SIPObject).then(function (resMapCldUser)
                                                                            {


                                                                                var auditData = {
                                                                                    KeyProperty: "SIPUserEndpoint",
                                                                                    OldValue: {},
                                                                                    NewValue: SIPObject,
                                                                                    Description: "New SIPUser Created.",
                                                                                    Author: iss,
                                                                                    User: iss,
                                                                                    ObjectType: "SipUACEndpoint",
                                                                                    Action: "SAVE",
                                                                                    Application: "SIP User Endpoint Service"
                                                                                };
                                                                                addAuditTrail(Tenant, Company, iss, auditData);




                                                                                resContext.addSipUACEndpoint(SIPObject).then(function (resMapCntx)
                                                                                {
                                                                                    redisCacheHandler.addSipUserToCache(SIPObject, Company, Tenant);

                                                                                    callback(null, resSave);

                                                                                }).catch(function (errMapCntx)
                                                                                {
                                                                                    redisCacheHandler.addSipUserToCache(SIPObject, Company, Tenant);
                                                                                    callback(new Error('Error in mapping Context & SipUAC'), null);
                                                                                });

                                                                            }).catch(function (errMapCldUser)
                                                                            {
                                                                                redisCacheHandler.addSipUserToCache(SIPObject, Company, Tenant);
                                                                                callback(new Error('Error in mapping CEU & SipUAC'), null);
                                                                            });


                                                                        }).catch(function (errSave)
                                                                        {
                                                                            lock.unlock()
                                                                                .catch(function (err)
                                                                                {
                                                                                    logger.error('[DVP-Common.addClusterToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                                                                                });
                                                                            callback(errSave, undefined);

                                                                        });
                                                                    }
                                                                    else
                                                                    {
                                                                        callback(new Error('Sip user limit exceeded'), null);
                                                                    }

                                                                }).catch(function(ex)
                                                                {
                                                                    callback(ex, null);
                                                                });

                                                            }
                                                            else
                                                            {
                                                                lock.unlock()
                                                                    .catch(function (err)
                                                                    {
                                                                        logger.error('[DVP-Common.addClusterToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                                                                    });
                                                                callback(new Error('Sip user limits not defined'), null);
                                                            }

                                                        }
                                                        else
                                                        {
                                                            lock.unlock()
                                                                .catch(function (err)
                                                                {
                                                                    logger.error('[DVP-Common.addClusterToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                                                                });
                                                            callback(new Error('Organization resource access limits not set'), null);
                                                        }
                                                    }

                                                });
                                            }
                                            catch(ex)
                                            {
                                                lock.unlock()
                                                    .catch(function (err)
                                                    {
                                                        logger.error('[DVP-Common.addClusterToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                                                    });
                                            }


                                        });




                                    }
                                    else
                                    {
                                        callback(new Error("No context Found"),undefined);

                                    }
                                }).catch(function(errContext)
                                {
                                    callback(errContext,undefined);
                                });

                            }
                            catch(ex)
                            {
                                callback(ex,undefined);
                            }
                        }
                        else
                        {
                            callback(new Error("Context is Undefined"),undefined);
                        }


                    }
                    else
                    {
                        callback(new Error("No CloudEnduser found"),undefined);
                    }
                }).catch(function(errCloudUser)
                {
                    callback(errCloudUser, undefined);
                });

            }
            catch(ex)
            {
                logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Exception in searching cloudEnduser %s',reqId,jobj.CloudEndUserId,ex);
                callback(ex,undefined);

            }
        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - CloudEndUSerID is Undefined');
            callback(new Error("CloudEndUSerID is Undefined"),undefined);
        }

    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.SaveUser] - [%s] - [PGSQL] - Invalid object received at the start : SaveUser %s',reqId,JSON.stringify(jobj),ex);
        callback(new Error("No request Object received "),undefined);
    }
}

function  PickUserByUUID(reqId, uuid, companyId, tenantId, callback) {

    logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Method Hit',reqId);
    if(uuid)
    {
        try
        {
            DbConn.SipUACEndpoint.find({where: [{SipUserUuid: uuid},{CompanyId: companyId},{TenantId: tenantId}]})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Query completed successfully',reqId);
                    callback(undefined, resSip);

                }).catch(function (errSip) {

                logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                callback(errSip, undefined);
            });



        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - Method call failed ',reqId, ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserByUUID] - [%s] - UUID value Undefined ');
        callback(new Error("UUID value Undefined"), undefined);
    }

}

function  PickUserByName(Username,Company,Tenant,reqId, callback) {

    logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [PGSQL] - Method Hit',reqId);
    if(Username)
    {
        try
        {
            DbConn.SipUACEndpoint.find({where: [{SipUsername: Username},{CompanyId: Company},{TenantId: Tenant}],include:[{model: DbConn.Extension, as:'Extension'},{model: DbConn.CloudEndUser, as:'CloudEndUser'}]})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [PGSQL] - Query completed successfully',reqId);
                    callback(undefined, resSip);

                }).catch(function (errSip) {

                logger.error('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                callback(errSip, undefined);

            });



        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - Method call failed ',reqId, ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUserByName] - [%s] - Username value Undefined ');
        callback(new Error("Username value Undefined"), undefined);
    }

}

var GetUserByUsername = function(reqId, username, companyId, tenantId, callback)
{
    try
    {
        DbConn.SipUACEndpoint.find({where: [{SipUsername: username},{TenantId: tenantId},{CompanyId: companyId}]})
            .then(function (resp)
            {
                callback(null, resp);

            }).catch(function(err)
        {
            callback(err, null);
        });

    }
    catch(ex)
    {
        callback(ex, null);
    }

};

function  PickAllUsers(Company,Tenant,reqId,req, callback) {

    logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Method Hit',reqId);


    try
    {
        var pageNo =0;
        var rowCount =0;
        var isPaging =false;


        if(req && req.query && req.query.page && req.query.size)
        {
            pageNo = req.params.page;
            rowCount = req.params.size;
            isPaging=true;
        }


        if(isPaging)
        {
            DbConn.SipUACEndpoint.findAll({where: [{CompanyId: Company},{TenantId: Tenant},{Enabled:"TRUE"}],
                include:[{model: DbConn.Extension, as:"Extension"},
                    {model: DbConn.CloudEndUser, as:"CloudEndUser"}],
                offset: ((pageNo - 1) * rowCount),
                limit: rowCount})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Query completed successfully',reqId);
                    callback(undefined, resSip);

                }).catch(function (errSip) {

                logger.error('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                callback(errSip, undefined);

            });
        }
        else
        {
            DbConn.SipUACEndpoint.findAll({where: [{CompanyId: Company},{TenantId: Tenant},{Enabled:"TRUE"}], include:[{model: DbConn.Extension, as:"Extension"},{model: DbConn.CloudEndUser, as:"CloudEndUser"}]})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Query completed successfully',reqId);
                    callback(undefined, resSip);

                }).catch(function (errSip) {

                logger.error('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - [PGSQL] - Query failed',reqId, errSip);
                callback(errSip, undefined);

            });
        }





    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickAllUsers] - [%s] - Method call failed ',reqId, ex);
        callback(ex, undefined);
    }



}

function  PickAllUserCount(Company,Tenant,reqId, callback) {

    logger.debug('[DVP-SIPUserEndpointService.PickAllUserCount] - [%s] - [PGSQL] - Method Hit',reqId);

    try
    {
        DbConn.SipUACEndpoint.count({where: [{CompanyId: Company},{TenantId: Tenant},{Enabled:"TRUE"}], include:[{model: DbConn.Extension, as:"Extension"},{model: DbConn.CloudEndUser, as:"CloudEndUser"}]})
            .then(function (resSip) {

                logger.debug('[DVP-SIPUserEndpointService.PickAllUserCount] - [%s] - [PGSQL] - Query completed successfully',reqId);
                callback(undefined, resSip);

            }).catch(function (errSip) {

            logger.error('[DVP-SIPUserEndpointService.PickAllUserCount] - [%s] - [PGSQL] - Query failed',reqId, errSip);
            callback(errSip, 0);

        });



    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.PickAllUserCount] - [%s] - Method call failed ',reqId, ex);
        callback(ex, undefined);
    }



}


function UpdateUser(Username,jobj,Company,Tenant,reqId,iss,callback) {

    if(Username && jobj)
    {
        delete jobj.SipUserUuid;
        delete jobj.CompanyId;
        delete jobj.TenantId;

        console.log(JSON.stringify(jobj));

        try
        {
            DbConn.SipUACEndpoint
                .find({where: [{SipUsername: Username}, {CompanyId: Company}, {TenantId: Tenant}]})
                .then(function (resUser) {

                    var oldObj = {
                        SipUsername : resUser.SipUsername,
                        Password : resUser.Password,
                        EmailAddress : resUser.EmailAddress,
                        VoicemailAsEmail : resUser.VoicemailAsEmail,
                        SipExtension : resUser.SipExtension,
                        Pin : resUser.Pin,
                        TransInternalEnable : resUser.TransInternalEnable,
                        TransExternalEnable : resUser.TransExternalEnable,
                        TransGroupEnable : resUser.TransGroupEnable,
                        TransIVREnable : resUser.TransIVREnable,
                        DenyOutboundFor : resUser.DenyOutboundFor,
                        RecordingEnabled : resUser.RecordingEnabled,
                        ContextId : resUser.ContextId
                    };

                    var newObj = {
                        SipUsername : jobj.SipUsername,
                        Password : jobj.Password,
                        EmailAddress : jobj.EmailAddress,
                        VoicemailAsEmail : jobj.VoicemailAsEmail,
                        SipExtension : jobj.SipExtension,
                        Pin : jobj.Pin,
                        TransInternalEnable : jobj.TransInternalEnable,
                        TransExternalEnable : jobj.TransExternalEnable,
                        TransGroupEnable : jobj.TransGroupEnable,
                        TransIVREnable : jobj.TransIVREnable,
                        DenyOutboundFor : jobj.DenyOutboundFor,
                        RecordingEnabled : jobj.RecordingEnabled,
                        ContextId : jobj.ContextId
                    };

                    var auditData = {
                        KeyProperty: "SIPUserEndpoint",
                        OldValue: oldObj,
                        NewValue: newObj,
                        Description: "SIP USer Updated.",
                        Author: iss,
                        User: jobj.SipUsername,
                        ObjectType: "SipUACEndpoint",
                        Action: "UPDATE",
                        Application: "SIP User Endpoint Service"
                    };

                    if (!resUser) {

                        logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - No record found for SipUser %s ',reqId,Username);
                        callback(new Error("No SipUser record found"), undefined);

                    }
                    else {

                        try {

                            delete jobj.SipUsername;
                            delete jobj.SipUserUuid;
                            delete jobj.Enabled;
                            delete jobj.CompanyId;
                            delete jobj.TenantId;

                            resUser.updateAttributes(jobj).then(function (resUpdate) {

                                addAuditTrail(Tenant, Company, iss, auditData);

                                redisCacheHandler.addSipUserToCache(resUpdate, Company, Tenant);

                                logger.debug('[DVP-LimitHandler.UACManagement.UpdateUser] - [%s] - [PGSQL]  - Updating records of SipUser %s is succeeded ',reqId,Username);
                                callback(undefined, resUpdate);

                            }).catch(function (errUpdate) {

                                console.log("Project update failed ! " + errUpdate);
                                logger.error('[DVP-LimitHandler.UACManagement.UpdateUser] - [%s] - [PGSQL]  - Updating records of SipUser %s is failed - Data %s ',reqId,Username,JSON.stringify(jobj),errUpdate);
                                callback(errUpdate, undefined);

                            });

                        }
                        catch (ex) {
                            logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - Exception in updating SipUser %s ',reqId,Username,ex);
                            callback(ex, undefined);
                        }
                    }

                }).catch(function (errUser) {
                logger.error('[DVP-LimitSIPUserEndpointServiceHandler.UpdateUser] - [%s] - [PGSQL]  - Error in searching SipUser %s',reqId,Username,errUser);
                callback(errUser, undefined);
            });
        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.UpdateUser] - [%s] - [PGSQL]  - Exception in Method starts : UpdateUser ',reqId,Username,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        callback(new Error("Empty request Or Undefined Username"),undefined);
    }


}

function UpdateUserStatus(Username,status,Company,Tenant,reqId,iss,callback) {

    if(Username)
    {
        var SipObj= {
            Enabled:status
        };

        try
        {
            DbConn.SipUACEndpoint
                .find({where: [{SipUsername: Username}, {CompanyId: Company}, {TenantId: Tenant}]})
                .then(function (resUser)
                {
                    if (!resUser)
                    {
                        callback(new Error("No SipUser record found"), null);
                    }
                    else
                    {

                        try
                        {
                            lock(Tenant + '_' + Company + '_' + 'SIP_USER_LIMIT_LOCK', function(done)
                            {
                                try
                                {
                                    resUser.updateAttributes(SipObj).then(function (resUpdate)
                                    {

                                        var auditData = {
                                            KeyProperty: "SIPUserEndpoint",
                                            OldValue: resUser,
                                            NewValue: SipObj,
                                            Description: "SIP USer Updated.",
                                            Author: iss,
                                            User: iss,
                                            ObjectType: "SipUACEndpoint",
                                            Action: "UPDATE",
                                            Application: "SIP User Endpoint Service"
                                        };
                                        addAuditTrail(Tenant, Company, iss, auditData);

                                        done();

                                        redisCacheHandler.addSipUserToCache(resUpdate, Company, Tenant);

                                        callback(null, resUpdate);

                                    }).catch(function (errUpdate)
                                    {
                                        done();
                                        callback(errUpdate, undefined);

                                    });
                                }
                                catch(ex)
                                {
                                    done();
                                    callback(ex, null);
                                }

                            });

                        }
                        catch (ex)
                        {
                            logger.error('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - [PGSQL]  - Exception in updating SipUser %s ',reqId,Username,ex);
                            callback(ex, undefined);
                        }
                    }

                }).catch(function (errUser)
            {
                logger.error('[DVP-LimitSIPUserEndpointServiceHandler.UpdateUserStatus] - [%s] - [PGSQL]  - Error in searching SipUser %s',reqId,Username,errUser);
                callback(errUser, undefined);
            });
        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.UpdateUserStatus] - [%s] - [PGSQL]  - Exception in Method starts : UpdateUser ',reqId,Username,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        callback(new Error("Empty request Or Undefined Username"),undefined);
    }


}

function PickCompanyUsers(Company,Tenant,reqId,callback) {

    if(!isNaN(Company)&& Company)
    {
        try
        {
            DbConn.SipUACEndpoint
                .findAll({where:[{CompanyId: Company},{TenantId:Tenant}]})
                .then(function (resSip) {

                    logger.debug('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - %s Record found for Context %s ',reqId,resSip.length,Company);
                    callback(undefined, resSip);


                }).catch(function (errSip) {
                logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Error in searching SipUser of Company %s ',reqId,Company,errSip);
                callback(errSip, undefined);
            });

        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - [PGSQL]  - Exception in starting method:  ',reqId,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickCompanyUsers] - [%s] - GroupID is Undefined');
        callback(new Error(" GroupID is Undefined"), undefined);
    }

}



//Sipuser group
function CreateUserGroup(obj,Company,Tenant,reqId,callback) {
    if(obj)
    {
        if(obj.GroupName) {
            try {
                DbConn.UserGroup.find({where: [{GroupName: obj.GroupName},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resGroup) {

                    if (resGroup) {
                        logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Already in DB Group %s', reqId, obj.GroupName);
                        callback(new Error("Group is Alrady In DB"), undefined);
                    }
                    else {
                        try {

                            var UserGroupobj = DbConn.UserGroup
                                .build(
                                    {

                                        GroupName: obj.GroupName,
                                        Domain: obj.Domain,
                                        ExtraData: obj.ExtraData,
                                        ObjClass: "OBJCLZ",
                                        ObjType: "OBJTYP",
                                        ObjCategory: "OBJCAT",
                                        CompanyId:Company,
                                        TenantId: Tenant


                                    }
                                );

                            UserGroupobj.save().then(function (resGrpSave) {

                                redisCacheHandler.addGroupToCache(resGrpSave, Company, Tenant);

                                logger.debug('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion succeeded - Group %s', reqId, JSON.stringify(obj));
                                callback(undefined, resGrpSave);


                            }).catch(function (errGrpSave) {

                                logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - New user group insertion failed - Group %s', reqId, JSON.stringify(obj), errGrpSave);
                                callback(errGrpSave, undefined);

                            });



                        }
                        catch (ex) {
                            logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Exception in New user group insertion  - Group %s', reqId, JSON.stringify(obj), ex);
                            callback(ex, undefined);
                        }
                    }

                }).catch(function (errGroup) {

                    logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s', reqId, obj.GroupName, errGroup);
                    callback(errGroup, undefined);

                });





            }
            catch (ex) {
                logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  - Exception in user group Searching   - Group %s', reqId, JSON.stringify(obj), ex);
                callback(ex, undefined);
            }
        }
        else
        {
            logger.error('[DVP-SIPUserEndpointService.CreateUserGroup] - [%s] - [PGSQL]  -  GroupName is Undefined');
            callback(new Error("GroupName is Undefined"), undefined);
        }
    }
    else
    {
        callback(new Error("Empty request"),undefined);
    }




}

function UnAssignUserFromGroup(SID,GID,Company,Tenant,callback) {

    if(!isNaN(SID)&& SID &&!isNaN(GID)&& GID)
    {
        try {
            DbConn.SipUACEndpoint.find({where: [{id: SID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resSip) {

                if(!resSip)
                {
                    callback(new Error("No SipUser Record Found"), undefined);
                }
                else
                {


                    if(GID)
                    {
                        try {
                            DbConn.UserGroup.find({where: [{id: GID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resGroup)
                            {

                                if(!resGroup)
                                {
                                    callback(new Error("No group record found"), undefined);
                                }
                                else
                                {
                                    {
                                        try {
                                            resGroup.removeSipUACEndpoint(resSip).then(function (resMapGroup) {

                                                redisCacheHandler.addGroupToCache(resGroup, Company, Tenant);

                                                callback(undefined, resMapGroup)

                                            }).catch(function (resMapGroup) {
                                                callback(resMapGroup, undefined)
                                            });


                                        }
                                        catch (ex) {
                                            callback(ex, undefined);
                                        }
                                    }
                                }

                            }).catch(function(err)
                            {
                                callback(err, undefined);
                            })

                        }
                        catch (ex) {
                            callback(ex, undefined);
                        }
                    }
                    else
                    {
                        callback(new Error("GroupID is Undefined"),undefined);
                    }


                }

            }).catch(function (errSip) {
                callback(errSip, undefined);
            });


        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("UserID or GroupId is Undefined"),undefined);
    }

}

function AssignUserToGroup(SID,GID,Company,Tenant,reqId,callback) {

    if(!isNaN(SID)&& SID &&!isNaN(GID)&& GID)
    {
        try {
            DbConn.SipUACEndpoint.find({where: [{id: SID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resSip) {

                if(!resSip)
                {
                    callback(new Error("No SipUser Record Found"), undefined);
                }
                else
                {


                    if(GID)
                    {
                        try {
                            DbConn.UserGroup.find({where: [{id: GID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (resGroup)
                            {

                                if(!resGroup)
                                {
                                    callback(new Error("No group record found"), undefined);
                                }
                                else
                                {
                                    {
                                        try {
                                            resGroup.addSipUACEndpoint(resSip).then(function (resMapGroup) {

                                                redisCacheHandler.addSipUserToCache(resSip, Company, Tenant);

                                                callback(undefined, resMapGroup)

                                            }).catch(function (resMapGroup) {
                                                callback(resMapGroup, undefined)
                                            });


                                        }
                                        catch (ex) {
                                            callback(ex, undefined);
                                        }
                                    }
                                }

                            }).catch(function(err)
                            {
                                callback(err, undefined);
                            })

                        }
                        catch (ex) {
                            callback(ex, undefined);
                        }
                    }
                    else
                    {
                        callback(new Error("GroupID is Undefined"),undefined);
                    }


                }

            }).catch(function (errSip) {
                callback(errSip, undefined);
            });


        }
        catch(ex)
        {
            callback(ex,undefined);
        }
    }
    else
    {
        callback(new Error("UserID or GroupId is Undefined"),undefined);
    }

}

function FillUserGroup(obj,reqId,callback) {
    try {
        DbConn.Extension.find({where: [{id: obj.ExtensionId}]}).complete(function (err, ExtObject) {

            if (err) {
                logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Error in searching Extension -  Data - %s',reqId,obj.ExtensionId,err);
                callback(err, undefined);
            }

            else
            {
                if (ExtObject) {
                    logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Extension found -  Data - %s',reqId,JSON.stringify(ExtObject));
                    console.log(ExtObject);

                    try {
                        DbConn.UserGroup.find({where: [{id: obj.GroupId}]}).complete(function (errz, groupObject) {
                            if (errz) {
                                logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Error in searching UserGroup %s ',reqId,obj.GroupId,errz);
                                callback(errz, undefined);
                            }

                            else if (groupObject) {
                                logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - UserGroup %s found.Mapping is strating ',reqId,obj.GroupId);

                                try {
                                    groupObject.addExtension(ExtObject).complete(function (errx, groupInstancex) {

                                        if (errx) {
                                            logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Error in Mapping Extension %s with Group %s -  Data - %s',reqId,ExtObject.id,groupObject.id,errx);
                                            callback(errx, undefined)
                                        }
                                        else  {
                                            logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Mapping Extension %s with Group %s is succeeded -  Data - %s',reqId,ExtObject.id,groupObject.id);
                                            callback(undefined, groupInstancex)
                                        }






                                    });
                                }
                                catch (ex) {
                                    logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Exception in Mapping Extension %s with Group %s -  Data - %s',reqId,ExtObject.id,groupObject.id);
                                    callback(ex, undefined);
                                }

                            }

                            else {
                                logger.error('[DVP-SIPUserEndpointService.SipUserGroupManagement.FillSipUserGroup] - [%s] - [PGSQL]  - No record found for group %s  ',reqId,obj.GroupId);
                                callback("No Group record found", undefined);
                            }

                        })

                    }
                    catch (ex) {
                        logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Exception in searching group %s  ',reqId,obj.GroupId,ex);
                        callback(ex, undefined);
                    }


                }
                else {
                    logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - No record found for Extension %s  ',reqId,obj.ExtensionId);
                    callback(err, sipObject);

                }
            }

        });



    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [PGSQL]  - Exception in starting method : FillUserGroup  - Data %s',reqId,JSON.stringify(obj));
        callback(ex,undefined);
    }



}

function UpdateUserGroup(GID,obj,Company,Tenant,reqId,callback) {
    if(obj)
    {
        if(!isNaN(GID)&&GID)
        {
            try {


                DbConn.UserGroup.find({where: [{id: GID},{CompanyId:Company},{TenantId:Tenant}]}).then(function (grp)
                {
                    if(grp)
                    {
                        grp.updateAttributes({GroupName: obj.GroupName,
                            Domain: obj.Domain,
                            ExtraData: obj.ExtraData,
                            ObjClass: "OBJCLZ",
                            ObjType: "OBJTYP",
                            ObjCategory: "OBJCAT",
                            CompanyId: Company,
                            TenantId: Tenant}).then(function (resGrpUpdate)
                        {

                            redisCacheHandler.addGroupToCache(resGrpUpdate, Company, Tenant);
                            logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Updation succeeded -  Data - %s',reqId,JSON.stringify(obj));

                            callback(undefined,resGrpUpdate);
                        }).catch(function (errGrpUpdate) {
                            logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Updation failed -  Data - %s',reqId,JSON.stringify(obj),err);
                            callback(errGrpUpdate,undefined);

                        });

                    }
                    else
                    {
                        callback(new Error('Group record not found'), false);
                    }

                }).catch(function(err)
                {
                    logger.error('[DVP-LimitHandler.UpdateMaxLimit] - [%s] - Get Extension PGSQL query failed', reqId, err);
                    callback(err, false);
                });

            }
            catch(ex)
            {
                logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [PGSQL]  - Exception in starting method : UpdateSipUserGroup  -  Data - %s',reqId,JSON.stringify(obj),ex);
                callback(ex,undefined);
            }
        }
        else
        {
            callback(new Error("GroupID is not in Correct format"),undefined);
        }

    }
    else
    {
        callback(new Error("Empty request"),undefined);
    }

}

var DeleteGroupDB = function(reqId, grpId, companyId, tenantId, callback)
{
    try
    {
        DbConn.UserGroup.find({where: [{id: grpId},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (grpRec)
        {
            if(grpRec)
            {
                grpRec.destroy().then(function (result)
                {
                    redisCacheHandler.removeGroupFromCache(grpId, companyId, tenantId);
                    callback(undefined, true);

                }).catch(function(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.DeleteGroupDB] - [%s] - Exception occurred', reqId, err);
                    callback(err, false);
                });
            }
            else
            {
                callback(new Error('Did record not found'), false);
            }

        }).catch(function(err)
        {
            logger.error('[DVP-SIPUserEndpointService.DeleteGroupDB] - [%s] - Exception occurred', reqId, err);
            callback(err, false);
        })

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.DeleteGroupDB] - [%s] - Exception occurred', reqId, ex);
        callback(ex, false);
    }

};

function PickUserGroup(GroupID,Company,Tenant,reqId,callback) {
    if(!isNaN(GroupID)&& GroupID)
    {
        try {
            DbConn.UserGroup
                .find({
                        where: [{id: GroupID},{CompanyId:Company},{TenantId:Tenant}], include:[{model: DbConn.Extension, as: "Extension"}]
                    }
                ).then(function (resGrp) {

                if (!resGrp) {

                    logger.error('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - No record found for Group %s ',reqId,GroupID);

                    callback(new Error("No group record found"), undefined);

                } else {

                    logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupID);
                    callback(undefined, resGrp);

                }

            }).catch(function (errGrp) {

                logger.error('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Error in searching Group %s ',reqId,GroupID,errGrp);
                callback(errGrp, undefined);
            });

        }
        catch(ex)
        {
            logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - Exception in method starting : PickUserGroup ',reqId,GroupID,ex);
            callback(ex,undefined);
        }
    }
    else{
        logger.debug('[DVP-SIPUserEndpointService.PickUserGroup] - [%s] - [PGSQL]  - GroupId is Undefined ');
        callback(new Error("GroupId is Undefined"),undefined);
    }

}

function GetGroupEndpoints(obj,Company,Tenant,reqId,callback) {
    try {
        DbConn.UsrGrp
            .findAll({
                    where: {CSDBUserGroupId: obj}
                }
            ).then(function (resUsrGrp) {

            if (!resUsrGrp) {
                logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - No record found for GroupEndpoints of CSDBUserGroupId %s ',reqId,obj);
                callback("No group record found", undefined);

            } else {

                logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - Record found for GroupEndpoints of CSDBUserGroupId %s _ result %s',reqId,obj,JSON.stringify(resUsrGrp));
                callback(undefined, resUsrGrp);


            }


        }).catch(function (errUsrGrp) {
            logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [PGSQL]  - Error in searching GroupEndpoints of CSDBUserGroupId %s ',reqId,obj,errUsrGrp);
            callback(errUsrGrp, undefined);
        });



    }
    catch(ex)
    {

        logger.error('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - Error in starting method :  GetGroupEndpoints',reqId,obj,ex);
        callback(ex, undefined);
    }
}

function PickUsersGroup(SipID,Company,Tenant,reqId,callback) {

    if(!isNaN(SipID)&& SipID)
    {
        try {

            DbConn.SipUACEndpoint.find({where: [{id: parseInt(SipID)},{CompanyId:Company},{TenantId:Tenant}], include: [{model: DbConn.UserGroup, as:"UserGroup"}],attributes:["id"]})
                .then(function (resSip) {

                    if (!resSip) {
                        logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - No records for SipUACEndpoint %s ',reqId,SipID);
                        callback(new Error("No group record found"), undefined);

                    } else {
                        logger.debug('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - Records for SipUACEndpoint %s ',reqId,SipID);
                        if(resSip.UserGroup)
                        {
                            callback(undefined, resSip.UserGroup);
                        }
                        else
                        {
                            callback(new Error("user is not belongs to any group"),undefined);
                        }


                    }

                }).catch(function (errSip) {
                logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - Error in searching UsrGrp records of SipUACEndpoint %s ',reqId,SipID,errSip);
                callback(errSip, undefined);
            });



        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - [PGSQL]  - Error in Method starting : EndpointGroupID  %S ',reqId,SipID,ex);
            callback(ex,undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUsersGroup] - [%s] - GroupId is Undefined ');
        callback(new Error("GroupId is not in correct format"),undefined);
    }


}

function PickCompayGroups(Company,Tenant,reqId,callback) {

    if(!isNaN(Company)&&Company)
    {
        try{
            DbConn.UserGroup
                .findAll({where : [{CompanyId:Company},{TenantId:Tenant}], include:[{model: DbConn.Extension, as: "Extension"}]
                    }
                ).then(function(resGroup)
            {
                logger.debug('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - %s Records found for company %s ',reqId,resGroup.length,Company);
                callback(undefined, resGroup);

            }).catch(function (errGroup) {
                logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - Error in searching Group records of company %s ',reqId,Company,errGroup);
                callback(errGroup, undefined);
            });


        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] - [PGSQL]  - Exception on method starts : AllRecWithCompany - Data %s',reqId,Company,ex);
            callback(ex, undefined);
        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickCompayGroups] - [%s] -  CompanyID is Undefined');
        callback(new Error("CompanyID is Undefined"), undefined);
    }

}

function PickUsersInGroup(GroupId,Company,Tenant,reqId,callback) {

    if(!isNaN(GroupId)&&GroupId)
    {
        try {
            DbConn.UserGroup.find({where: [{id: GroupId},{CompanyId:Company},{TenantId:Tenant}], include: [{model: DbConn.SipUACEndpoint , as: "SipUACEndpoint" }]})
                .then(function (resGroup) {

                    if (!resGroup) {
                        logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - No User record found for Group %s ',reqId,GroupId);
                        callback(new Error("No group record found"), undefined);

                    } else {

                        logger.debug('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Record found for Group %s ',reqId,GroupId);
                        callback(undefined, resGroup);

                    }

                }).catch(function (errGroup) {
                logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Error in searching Users of Group %s ',reqId,GroupId,errGroup);
                callback(errGroup, undefined);
            });

        }
        catch(ex)
        {
            logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - [PGSQL]  - Exception occurred on start : GetAllUsersInGroup %s ',reqId,GroupId,ex);
            callback(ex, undefined);

        }
    }
    else
    {
        logger.error('[DVP-SIPUserEndpointService.PickUsersInGroup] - [%s] - GroupID is Undefined');
        callback(new Error("GroupID is Undefined"), undefined);
    }


}



//Sipuser
module.exports.CreateUser = CreateUser;
module.exports.PickUserByUUID = PickUserByUUID;
module.exports.PickUserByName = PickUserByName;
module.exports.UpdateUser = UpdateUser;
module.exports.PickCompanyUsers = PickCompanyUsers;
module.exports.PickAllUsers = PickAllUsers;
module.exports.UpdateUserStatus = UpdateUserStatus;
module.exports.GetEnabledSipUserCount = GetEnabledSipUserCount;


//Sip user group

module.exports.CreateUserGroup = CreateUserGroup;
module.exports.AssignUserToGroup = AssignUserToGroup;
module.exports.FillUsrGrp = FillUserGroup;
module.exports.UpdateUserGroup = UpdateUserGroup;
//get funcs
module.exports.PickUserGroup = PickUserGroup;
module.exports.GetGroupEndpoints = GetGroupEndpoints;
module.exports.PickUsersGroup = PickUsersGroup;
module.exports.PickCompayGroups = PickCompayGroups;
module.exports.PickUsersInGroup = PickUsersInGroup;

module.exports.DeleteGroupDB = DeleteGroupDB;
module.exports.UnAssignUserFromGroup = UnAssignUserFromGroup;
module.exports.GetUserByUsername = GetUserByUsername;

module.exports.PickAllUserCount = PickAllUserCount;

