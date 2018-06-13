var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var DbConn = require('dvp-dbmodels');
var fs = require("fs");

function getPhoneConfig(tenant, company, data, reqId, callback) {
  DbConn.IPPhoneConfig.find({
      where: {
          TenantId:tenant,
          CompanyId:company,
          mac: data},
      include: [{
          model: DbConn.SipUACEndpoint,
          as: "SipUACEndpoint",
          include: {
              model: DbConn.CloudEndUser,
              as: "CloudEndUser"
          }
      }]})
        .then(function (all_recode) {
            callback(null, all_recode);
        })
        .catch(function (error) {
            callback(error, false);
        });
}
function getPhoneConfigs(tenant, company,reqId, callback) {
    DbConn.IPPhoneConfig.findAll({where: {TenantId:tenant,CompanyId:company}})
        .then(function (all_recode) {
            callback(null, all_recode);
        })
        .catch(function (error) {
            callback(error, false);
        });
}
function getPhoneTemplate(data, reqId, callback) {
    DbConn.IPPhoneTemplate.find({where: {model: data}})
        .then(function (all_recode) {
            callback(null, all_recode);
        })
        .catch(function (error) {
            callback(error, false);
        });
}
function getPhoneTemplates(reqId, callback) {
    DbConn.IPPhoneTemplate.findAll()
        .then(function (all_recode) {
            callback(null, all_recode);
        })
        .catch(function (error) {
            callback(error, false);
        });
}
function SetIPPhoneConfig(tenant, company,reqId, data, callback) {
    DbConn.IPPhoneConfig.find({where: {TenantId:tenant,CompanyId:company,mac: data['mac']}})
        .then(function (available_recode) {
            if (available_recode) {
                logger.debug('[DVP-SIPUserEndpointService.SetIPPhoneConfig] - [%s] - [PGSQL]  - Already in DB  %s', reqId, data);
                callback(new Error("Config Alrady In DB"), undefined);
            } else {
                var config_data_set = DbConn.IPPhoneConfig.build({
                    mac: data['mac'],
                    configdata: data['config'],
                    model: data['model'],
                    CompanyId: company,
                    TenantId: tenant
                });
                config_data_set.save()
                    .then(function (result) {
                        logger.debug('[DVP-SIPUserEndpointService.SetIPPhoneConfig] - [%s] - [PGSQL]  - config insertion succeeded -  %s', reqId, JSON.stringify(result));
                        callback(null, result);
                    })
                    .catch(function (error) {
                        logger.error('[DVP-SIPUserEndpointService.SetIPPhoneConfig] - [%s] - [PGSQL]  - config insertion failed -  %s', reqId, JSON.stringify(data), error);
                        callback(error, undefined);
                    })
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.SetIPPhoneConfig] - [%s] - [PGSQL]  - config insertion  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, null);
        });
}
function SetIPPhoneTemplate(reqId, data, callback) {
    DbConn.IPPhoneTemplate.find({where: [{model: data['model']}, {make: data['make']}]})
        .then(function (available_recode) {
            if (available_recode) {
                logger.debug('[DVP-SIPUserEndpointService.SetIPPhoneTemplate] - [%s] - [PGSQL]  - Template available %s phone model for %s ', reqId, data['type'], data['model']);
                callback(new Error("Template Available "), undefined);
            } else {
                var config_data_set = DbConn.IPPhoneTemplate.build({
                    model: data['model'],
                    make: data['make'],
                    template:data['template']
                });
                config_data_set.save()
                    .then(function (result) {
                        logger.debug('[DVP-SIPUserEndpointService.SetIPPhoneTemplate] - [%s] - [PGSQL]  - Template insertion succeeded -  %s', reqId, JSON.stringify(result));
                        callback(undefined, result);
                    })
                    .catch(function (error) {
                        logger.error('[DVP-SIPUserEndpointService.SetIPPhoneTemplate] - [%s] - [PGSQL]  - Template insertion failed -  %s', reqId, JSON.stringify(data), error);
                        callback(error, undefined);
                    })
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.SetIPPhoneTemplate] - [%s] - [PGSQL]  - Template insertion  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, undefined);
        });
}
function updateIPPhoneConfig(tenant, company,reqId, mac, data, callback) {
    DbConn.IPPhoneConfig.find({where: {TenantId:tenant,CompanyId:company,mac: mac}})
        .then(function (available_recode) {
            if (available_recode) {
                available_recode.updateAttributes({configdata: data})
                    .then(function (result) {
                        logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - config update succeeded -  %s', reqId, JSON.stringify(result));
                        callback(undefined, result);
                    })
                    .catch(function (error) {
                        logger.error('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - config update failed -  %s', reqId, JSON.stringify(data), error);
                        callback(error, undefined);
                    })
            } else {
                logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - Record Not Found  in DB  %s', reqId, data);
                callback(new Error("Config Alrady In DB"), undefined);
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - config insertion  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, undefined);
        });
}
function updateIPPhoneSipAccounts(tenant, company,reqId, data, mac, user, callback) {
    DbConn.IPPhoneConfig.find({where: {TenantId:tenant,CompanyId:company,mac: mac}})
        .then(function (available_recode) {
            if (available_recode) {


                DbConn.SipUACEndpoint.find({
                    where:[{
                        SipUsername: user,
                        Enabled: true,
                        CompanyId: company,
                        TenantId: tenant}]}).then(function(sipUsr){

                            if(sipUsr) {

                                available_recode.updateAttributes({Id:sipUsr.id})
                                    .then(function (result) {
                                        logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - config update succeeded -  %s', reqId, JSON.stringify(result));
                                        callback(undefined, result);
                                    })
                                    .catch(function (error) {
                                        logger.error('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - config update failed -  %s', reqId, JSON.stringify(data), error);
                                        callback(error, undefined);
                                    })

                            }else{

                                logger.error('[DVP-SIPUserEndpointService.updateIPPhoneSipAccounts] Error occurred', err);
                                callback(err, undefined);
                            }


                }).catch(function(err) {
                    logger.error('[DVP-SIPUserEndpointService.updateIPPhoneSipAccounts] Error occurred', err);
                    callback(err, undefined);
                })

            } else {
                logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - Record Not Found  in DB  %s', reqId, data);
                callback(new Error("Config Alrady In DB"), undefined);
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.updateIPPhoneConfig] - [%s] - [PGSQL]  - config insertion  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, undefined);
        });
}

function updateIPPhoneReassignCompany(tenant, company,reqId, data, mac, callback) {

    var newCompany = data.company;
    var newTenant = data.Tenant;
    DbConn.IPPhoneConfig.update({comapny: newCompany, tenant: newTenant}, {
        where: {
            TenantId: tenant,
            CompanyId: company,
            mac: mac
        }
    })
        .then(function (available_recode) {
            if (available_recode) {


                logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneReassignCompany] - [%s] - [PGSQL]  - config update succeeded -  %s', reqId, JSON.stringify(result));
                callback(undefined, available_recode);


            } else {
                logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneReassignCompany] - [%s] - [PGSQL]  - Record Not Found  in DB  %s', reqId, data);
                callback(new Error("Config Alrady In DB"), undefined);
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.updateIPPhoneReassignCompany] - [%s] - [PGSQL]  - config insertion  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, undefined);
        });
}






function updateIPPhoneTemplate(reqId, data, callback) {
    DbConn.IPPhoneTemplate.find({where: {model: data['model']}})
        .then(function (available_recode) {
            if (available_recode) {
                available_recode.updateAttributes({template: data['template'], make: data['make']})
                    .then(function (result) {
                        logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneTemplate] - [%s] - [PGSQL]  - Template update succeeded -  %s', reqId, JSON.stringify(result));
                        callback(undefined, result);
                    })
                    .catch(function (error) {
                        logger.error('[DVP-SIPUserEndpointService.updateIPPhoneTemplate] - [%s] - [PGSQL]  - Template update failed -  %s', reqId, JSON.stringify(data), error);
                        callback(error, undefined);
                    })
            } else {
                logger.debug('[DVP-SIPUserEndpointService.updateIPPhoneTemplate] - [%s] - [PGSQL]  - Record Not Found  in DB  %s', reqId, data);
                callback(new Error("Record Not Found"), undefined);
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.updateIPPhoneTemplate] - [%s] - [PGSQL]  - Template update  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, undefined);
        });
}
function deleteIPPhoneConfig(tenant, company,reqId, data, callback) {
    DbConn.IPPhoneConfig.destroy({where: {TenantId:tenant,CompanyId:company,mac: data}})
        .then(function (available_recode) {
            if (available_recode) {
                logger.debug('[DVP-SIPUserEndpointService.deleteIPPhoneConfig] - [%s] - [PGSQL]  - config delete succeeded -  %s', reqId, JSON.stringify("config delete succeeded"));
                callback(undefined, "config delete succeeded");
            } else {
                logger.debug('[DVP-SIPUserEndpointService.deleteIPPhoneConfig] - [%s] - [PGSQL]  - Record Not Found  in DB  %s', reqId, data);
                callback(new Error("Record Not Found"), undefined);
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.deleteIPPhoneConfig] - [%s] - [PGSQL]  - config delete  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, undefined);
        });
}
function deleteIPPhoneTemplate(reqId, data, callback) {
    DbConn.IPPhoneTemplate.destroy({where: {model: data}})
        .then(function (available_recode) {
            if (available_recode) {
                logger.debug('[DVP-SIPUserEndpointService.deleteIPPhoneTemplate] - [%s] - [PGSQL]  - Template delete succeeded -  %s', reqId, JSON.stringify(available_recode));
                callback(undefined, available_recode);
            } else {
                logger.debug('[DVP-SIPUserEndpointService.deleteIPPhoneTemplate] - [%s] - [PGSQL]  - Record Not Found  in DB  %s', reqId, data);
                callback(new Error("Record Not Found in DB"), undefined);
            }
        })
        .catch(function (ex) {
            logger.error('[DVP-SIPUserEndpointService.deleteIPPhoneTemplate] - [%s] - [PGSQL]  - Template delete  -  %s', reqId, JSON.stringify(data), ex);
            callback(ex, undefined);
        });
}
function UploadPhoneList(reqId, data, company, tenant, callback) {
    var resultlist = [];
    for (var key in data) {
        var PhoneDetailsData = {
            CompanyId: company,
            TenantId: tenant,
            mac: data[key].mac,
            model: data[key].model
        };
        resultlist.push(PhoneDetailsData);
    }
    DbConn.IPPhoneConfig.bulkCreate(
        resultlist, {validate: false, individualHooks: true}
    ).then(function (result) {
        logger.debug('[DVP-SIPUserEndpointService.UploadPhoneList] - [%s] - [PGSQL]  - PhoneDetailsData insertion succeeded -  %s', reqId, JSON.stringify(result));
        callback(undefined, result);
    }).catch(function (error) {
        logger.error('[DVP-SIPUserEndpointService.UploadPhoneList] - [%s] - [PGSQL]  - PhoneDetailsData insertion failed -  %s', reqId, JSON.stringify(data), error);
        callback(error, undefined);
    }).finally(function () {
        logger.info('UploadContacts - %s - %s ms Done.');
    });

}
function getAllPhoneList(reqId,teant, company,callback) {
    if(teant&&company){
        DbConn.IPPhoneConfig.findAll({where: {TenantId: teant, CompanyId: company}})
            .then(function (all_recode) {
                callback(null, all_recode);
            })
            .catch(function (error) {
                callback(error, false);
            });
    }else{
        DbConn.IPPhoneConfig.findAll()
            .then(function (all_recode) {
                callback(null, all_recode);
            })
            .catch(function (error) {
                callback(error, false);
            });
    }
}


module.exports.getPhoneConfig = getPhoneConfig;
module.exports.getPhoneConfigs = getPhoneConfigs;
module.exports.getPhoneTemplate = getPhoneTemplate;
module.exports.getPhoneTemplates = getPhoneTemplates;
module.exports.SetIPPhoneConfig = SetIPPhoneConfig;
module.exports.SetIPPhoneTemplate = SetIPPhoneTemplate;
module.exports.updateIPPhoneConfig = updateIPPhoneConfig;
module.exports.updateIPPhoneTemplate = updateIPPhoneTemplate;
module.exports.deleteIPPhoneConfig = deleteIPPhoneConfig;
module.exports.deleteIPPhoneTemplate = deleteIPPhoneTemplate;
module.exports.UploadPhoneList = UploadPhoneList;
module.exports.getAllPhoneList = getAllPhoneList;
module.exports.updateIPPhoneSipAccounts = updateIPPhoneSipAccounts;
module.exports.updateIPPhoneReassignCompany = updateIPPhoneReassignCompany;

