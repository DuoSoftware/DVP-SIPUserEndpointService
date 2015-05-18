/**
 * Created by pawan on 2/10/2015.
 */

var restify = require('restify');
var sre = require('swagger-restify-express');
var context=require('./SIPUserEndpointService.js');
var UACCreate=require('./CreateSipUACrec.js');
var Extmgt=require('./ExtensionManagementAPI.js');
var UACUpdate=require('./UpdateSipUserData.js');
//var Schedule=require('./ScheduleApi.js');
var group=require('./SipUserGroupManagement.js');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var config = require('config');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var uuid = require('node-uuid');

var port = config.Host.port || 3000;
var version=config.Host.version;


var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
});
//Server listen

//Enable request body parsing(access)
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());

RestServer.listen(port, function () {
    console.log('%s listening at %s', RestServer.name, RestServer.url);
});
//Tested :- Done
//.......................................................................................................................

//RestServer.post('/dvp/'+version+'/context_mgmt/save_contextdata',function(req,res,next)
RestServer.post('/DVP/'+version+'/ContextManagement/NewContextData',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.ContextManagement.NewContextData] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId,JSON.stringify(req.body));

        context.AddOrUpdateContext(req,reqId, function (err, resz) {

            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(resz.Context.toString());

            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.ContextManagement.NewContextData] - [%s] - [HTTP]  - Exception on Request received -  Data - %s ',reqId,JSON.stringify(req.body));
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});

//Tested :- Done
//.......................................................................................................................

RestServer.post('/dvp/'+version+'/uac_mgmt/save_uac',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId,JSON.stringify(req.body));

        UACCreate.SaveSip(req,reqId,function (err,resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }

        });
    }
    catch(ex)
    {
        logger.debug('[DVP-LimitHandler.UACManagement.NewUAC] - [%s] - [HTTP]  - Exception in Request receiving  -  Data - %s ',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();
});

//Tested :- Done
//.......................................................................................................................

RestServer.post('/dvp/'+version+'/uac_mgmt/updt_uac',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.UACManagement.UpdateUAC] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId,JSON.stringify(req.body));

        UACUpdate.UpdateUacUserData(req.body,reqId,function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.UACManagement.UpdateUAC] - [%s] - [HTTP]  - Exception in Request -  Data - %s ',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});

//Tested :- Done
//.......................................................................................................................

RestServer.post('/dvp/'+version+'/ext_mgmt/update_extension_st/:ref/:st',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.ExtensionManagement.UpdateExtensionStatus] - [%s] - [HTTP]  - Request received -  Data - Ref %s Status %s ',reqId,req.params.ref,req.params.st);

        Extmgt.ChangeAvailability(req.params.ref,req.params.st,reqId,function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }


        });
    }
    catch(ex)
    {
        logger.debug('[DVP-LimitHandler.ExtensionManagement.UpdateExtensionStatus] - [%s] - [HTTP]  - Exception in Request -  Data - Ref %s Status %s ',reqId,req.params.ref,req.params.st);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();
});
//Tested :- Done
//.......................................................................................................................

RestServer.post('/dvp/'+version+'/ext_mgmt/add_extension',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.ExtensionManagement.NewExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        Extmgt.AddExtension(req.body,reqId,function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end("1");
            }


        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.ExtensionManagement.NewExtension] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});
//.......................................................................................................................








//RestServer.post('/dvp/'+version+'/ext_mgmt/map_extension',function(req,res,next)
RestServer.post('/dvp/'+version+'/ext_mgmt/map_extension_with_UAC',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtensionWithUAC] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        Extmgt.MapWithSipUacEndpoint(req.body,reqId,function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtensionWithUAC] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();


});







RestServer.post('/dvp/'+version+'/ext_mgmt/map_extension_group',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.ExtensionManagement.MapExtensionWithGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        Extmgt.MapwithGroup(req.body,reqId,function (err, resz) {
            if(err)
            {
                res.end("err");
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.ExtensionManagement.MapExtensionWithGroup] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();


});

//Tested :- Done
//.......................................................................................................................

RestServer.post('/dvp/'+version+'/sipgroup_mgt/sipuser_group/add_sipuser_group',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.NewSipUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        group.AddSipUserGroup(req.body,reqId, function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(resz.GroupName.toString());
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.SipUserGroupManagement.NewSipUserGroup] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});





//Tested :- Done
//.......................................................................................................................
/*
RestServer.post('/dvp/:version/sipgroup_mgt/sipuser_group/map_extensionid',function(req,res,next)
{
    try {
        group.MapExtensionID(req.body, function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});*/
//Tested :- Done
//.......................................................................................................................




RestServer.post('/dvp/'+version+'/sipgroup_mgt/sipuser_group/fill_usrgrp',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.FillSipUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        group.FillUsrGrp(req.body,reqId,function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.SipUserGroupManagement.FillSipUserGroup] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});
//Tested :- Done
//.......................................................................................................................





RestServer.post('/dvp/'+version+'/sipgroup_mgt/sipuser_group/update_sipuser_group',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.UpdateSipUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        group.UpdateSipUserGroup(req.body,reqId,function (err, res) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.SipUserGroupManagement.UpdateSipUserGroup] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});

//.......................................................................................................................
/*
 RestServer.post('/dvp/:version/scheduleapi/add_schedule',function(req,res,err)
 {
 Schedule.AddSchedule(req,res,err);
 });
 //.......................................................................................................................

 RestServer.post('/dvp/:version/scheduleapi/updt_scheduledata',function(req,res,err)
 {
 Schedule.UpdateScheduleData(req.body);
 });
 //.......................................................................................................................

 RestServer.post('/dvp/:version/scheduleapi/add_appdata',function(req,res,err)
 {
 Schedule.UpdateAppoinmentData(req.body);
 });
 //.......................................................................................................................

 RestServer.post('/dvp/:version/scheduleapi/update_sch_id_app',function(req,res,err)
 {
 Schedule.UpdateScheduleIDAppointment(req.body);
 });
 //.......................................................................................................................

 RestServer.post('/dvp/:version/scheduleapi/update_sch_id',function(req,res,err)
 {
 Schedule.UpdateScheduleID(req.body);
 });

 */

//Tested :- Done
//.......................................................................................................................




RestServer.get('/dvp/'+version+'/uac_mgmt/find_context/:cmpid',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.UACManagement.FindContextByCompany] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.cmpid);

        context.GetContextDetails(req.params.cmpid, function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.UACManagement.FindContextByCompany] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,req.params.cmpid);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();


});



//Tested :- Done
//.......................................................................................................................

RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/get_group_data/:name',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.GroupData] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.name);

        group.GetGroupData(req.params.name,reqId, function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });

    }
    catch(ex)
    {
        logger.error('[DVP-LimitHandler.SipUserGroupManagement.GroupData] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,req.params.name);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();


});
//.......................................................................................................................



RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/get_group_endpoints/:GID',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.GroupEndPoints] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.GID);

        group.GetGroupEndpoints(req.params.GID, function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.GroupEndPoints] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,req.params.GID,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();

});

//.......................................................................................................................



RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/endpoint_groupid/:EID',function(req,res,next)
{

    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.EndpointGroupID] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.EID);

        group.EndpointGroupID(req.params.EID,reqId,function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.EndpointGroupID] - [%s] - [HTTP]  - Exception in Request - Data %s',reqId,req.params.EID,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();
});

//.......................................................................................................................



RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/AllRecWithCompany/:CompanyId',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.AllRecWithCompany] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.CompanyId);

        group.AllRecWithCompany(req.params.CompanyId,reqId, function (err, res) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.AllRecWithCompany] - [%s] - [HTTP]  - Exception Request -  Data - %s',reqId,req.params.CompanyId);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();


});
//.......................................................................................................................

RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/get_all_users_in_group/:companyid',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.AllUsersInGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.companyid);

        group.GetAllUsersInGroup(req.params.companyid,reqId,function (err, resz) {
            if(err)
            {
                res.end(err.toString());
            }
            else
            {
                res.end(JSON.stringify(resz));
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-LimitHandler.SipUserGroupManagement.AllUsersInGroup] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.companyid,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
        res.end(jsonString);
    }
    return next();


});









