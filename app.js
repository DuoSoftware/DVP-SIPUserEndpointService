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
RestServer.post('/DVP/'+version+'/ContextManagement/Context',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId,JSON.stringify(req.body));

        context.AddOrUpdateContext(req,reqId, function (err, resz) {

            if(err)
            {

                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);

            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.NewContextData] - [%s] - [HTTP]  - Exception on Request received -  Data - %s ',reqId,JSON.stringify(req.body));
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.NewContextData] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

//Tested :- Done
//.......................................................................................................................

//RestServer.post('/dvp/'+version+'/uac_mgmt/save_uac',function(req,res,next)
//check body cmp tent
RestServer.post('/DVP/'+version+'/UACManagement/UAC',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [HTTP]  - Request received -  Data - %s ',reqId,JSON.stringify(req.body));

        UACCreate.SaveSip(req,reqId,function (err,resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - [HTTP]  - Exception in Request receiving  -  Data - %s ',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.NewUAC] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();
});

//Tested :- Done
//.......................................................................................................................

//RestServer.post('/dvp/'+version+'/uac_mgmt/updt_uac',function(req,res,next)
//check body cmp tent
RestServer.post('/DVP/'+version+'/UACManagement/UAC/:Username',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - [HTTP]  - Request received -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body));

        UACUpdate.UpdateUacUserData(req.params.Username,req.body,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }

        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - [HTTP]  - Exception in Request -  Data - Username %s Body %s ',reqId,req.params.Username,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateUAC] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

//Tested :- Done
//.......................................................................................................................

//RestServer.post('/dvp/'+version+'/ext_mgmt/update_extension_st/:ref/:st',function(req,res,next)
RestServer.post('/DVP/'+version+'/ExtensionManagement/ExtensionStatus/:id/:st',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [HTTP]  - Request received -  Data - Id %s Status %s ',reqId,req.params.id,req.params.st);

        Extmgt.ChangeAvailability(req.params.id,req.params.st,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }


        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - [HTTP]  - Exception in Request -  Data - Id %s Status %s ',reqId,req.params.id,req.params.st);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateExtensionStatus] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();
});
//Tested :- Done
//.......................................................................................................................

//RestServer.post('/dvp/'+version+'/ext_mgmt/add_extension',function(req,res,next)
RestServer.post('/DVP/'+version+'/ExtensionManagement/Extension',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        Extmgt.AddExtension(req.body,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.NewExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.NewExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }


        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.NewExtension] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.NewExtension] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});
//.......................................................................................................................








//RestServer.post('/dvp/'+version+'/ext_mgmt/map_extension',function(req,res,next)
//RestServer.post('/dvp/'+version+'/ext_mgmt/map_extension_with_UAC',function(req,res,next)

//check
RestServer.post('/DVP/'+version+'/ExtensionManagement/:Ext/MapToUAC/:UAC',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [HTTP]  - Request received -  Data - Ext %s UAC %s Data %s',reqId,req.params.Ext,req.params.UAC,JSON.stringify(req.body));

        Extmgt.MapWithSipUacEndpoint(req.params.Ext,req.params.UAC,req.body,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - [HTTP]  - Exception in Request  -  Ext %s UAC %s Data %s',reqId,req.params.Ext,req.params.UAC,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithUAC] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});







//RestServer.post('/dvp/'+version+'/ext_mgmt/map_extension_group',function(req,res,next)
//check
RestServer.post('/DVP/'+version+'/ExtensionManagement/:Ext/MapToGroup/:Grp',function(req,res,next)
{

    //Updated
    /*
     var reqId='';

     try
     {
     reqId = uuid.v1();
     }
     catch(ex)
     {

     }



     try {

     logger.debug('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [HTTP]  - Request received -  Data - Extension %s Group Data %s',reqId,req.params.Ext,req.params.Grp,JSON.stringify(req.body));

     Extmgt.MapwithGroup(req.params.Ext,req.params.Grp,req.body,reqId,function (err, resz) {
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
     logger.error('[DVP-SIPUserEndpointService.MapExtensionWithGroup] - [%s] - [HTTP]  - Exception in Request -  Extension %s Group Data %s',reqId,req.params.Ext,req.params.Grp,JSON.stringify(req.body),ex);
     var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, -1);
     res.end(jsonString);
     }
     return next();
     */
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }



    try {

        logger.debug('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [HTTP]  - Request received -  Extension %s Group %',reqId,req.params.Ext,req.params.Grp);

        Extmgt.MapwithGroup(req.params.Ext,req.params.Grp,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - [HTTP]  - Exception in Request -  Extension %s Group % Other %s',reqId,req.params.Ext,req.params.Grp,JSON.stringify(req),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.ExtensionMapwithGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

//Tested :- Done
//.......................................................................................................................

//RestServer.post('/dvp/'+version+'/sipgroup_mgt/sipuser_group/add_sipuser_group',function(req,res,next)
RestServer.post('/dvp/'+version+'/SIPUserGroupManagemnt/SIPUserGroup',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        group.AddSipUserGroup(req.body,reqId, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.NewSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
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




//RestServer.post('/dvp/'+version+'/sipgroup_mgt/sipuser_group/fill_usrgrp',function(req,res,next)

// No need
RestServer.post('/DVP/'+version+'/SIPUserGroupManagemnt/fill_usrgrp',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,JSON.stringify(req.body));

        group.FillUsrGrp(req.body,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.FillSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});
//Tested :- Done
//.......................................................................................................................





//RestServer.post('/dvp/'+version+'/sipgroup_mgt/sipuser_group/update_sipuser_group',function(req,res,next)
//check
RestServer.post('/DVP/'+version+'/SIPUserGroupManagemnt/SIPUserGroup/:id',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [HTTP]  - Request received -  Data - ID %s Other %s',reqId,req.params.id,JSON.stringify(req.body));

        group.UpdateSipUserGroup(req.params.id,req.body,reqId,function (err, res) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - [HTTP]  - Exception in Request  - Data - ID %s Other %s',reqId,req.params.id,JSON.stringify(req.body),ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UpdateSipUserGroup] - [%s] - Request response : %s ',reqId,jsonString);
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




//RestServer.get('/dvp/'+version+'/uac_mgmt/find_context/:cmpid',function(req,res,next)
//check
RestServer.get('/DVP/'+version+'/UACManagement/Context/:cmpid',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.cmpid);

        context.GetContextDetails(req.params.cmpid, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,req.params.cmpid);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.FindContextByCompany] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});



//Tested :- Done
//.......................................................................................................................

//RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/get_group_data/:name',function(req,res,next)
RestServer.get('/DVP/'+version+'/SIPUserGroupManagemnt/Group/:name',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.name);

        group.GetGroupData(req.params.name,reqId, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.GroupData] - [%s] - [HTTP]  - Exception in Request  -  Data - %s',reqId,req.params.name);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.GroupData] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});
//.......................................................................................................................



//RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/get_group_endpoints/:GID',function(req,res,next)
RestServer.get('/DVP/'+version+'/SIPUserGroupManagemnt/GroupEndPoints/:GID',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.GID);

        group.GetGroupEndpoints(req.params.GID, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - [HTTP]  - Exception in Request -  Data - %s',reqId,req.params.GID,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.GroupEndPoints] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();

});

//.......................................................................................................................



//RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/endpoint_groupid/:EID',function(req,res,next)
RestServer.get('/DVP/'+version+'/SIPUserGroupManagemnt/EndPointGroupId/:EID',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.EID);

        group.EndpointGroupID(req.params.EID,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false,undefined);
                logger.debug('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - [HTTP]  - Exception in Request - Data %s',reqId,req.params.EID,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false,undefined);
        logger.debug('[DVP-SIPUserEndpointService.EndpointGroupID] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();
});

//.......................................................................................................................



//RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/AllRecWithCompany/:CompanyId',function(req,res,next)
RestServer.get('/DVP/'+version+'/SIPUserGroupManagemnt/GroupsOfCompany/:CompanyId',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.CompanyId);

        group.AllRecWithCompany(req.params.CompanyId,reqId, function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true, resz);
                logger.debug('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - [HTTP]  - Exception Request -  Data - %s',reqId,req.params.CompanyId);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.AllRecWithCompany] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});
//.......................................................................................................................

//RestServer.get('/dvp/'+version+'/sipgroup_mgt/sipuser_group/get_all_users_in_group/:companyid',function(req,res,next)
RestServer.get('/DVP/'+version+'/SIPUserGroupManagemnt/UsersInGroup/:Grp',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.Grp);

        group.GetAllUsersInGroup(req.params.Grp,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.Grp,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.AllUsersInGroup] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});


// New


RestServer.get('/DVP/'+version+'/UACManagement/UsersOfCompany/:CompId',function(req,res,next)
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

        logger.debug('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.CompId);

        UACUpdate.GetSIPUsersOfCompany(req.params.CompId,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.CompId,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.AllSIPUsersOfCompany] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.get('/DVP/'+version+'/ExtensionManagement/UsersOfExtension/:Ext',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.Ext);

        Extmgt.GetUserDataOfExtension(req.params.Ext,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.Ext,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.get('/DVP/'+version+'/ExtensionManagement/ExtensionsOfCompany/:Cmp',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Tenant=1;

    try {

        logger.debug('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.Cmp);

        Extmgt.GetUserDataOfExtension(req.params.Cmp,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.Cmp,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.GetExtensionsOfCompany] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});

RestServer.get('/DVP/'+version+'/ExtensionManagement/Extension/:Ext',function(req,res,next)
{
    var reqId='';

    try
    {
        reqId = uuid.v1();
    }
    catch(ex)
    {

    }

    var Tenant=1;
    var Company =1;
    try {

        logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - [HTTP]  - Request received -  Data - %s',reqId,req.params.Ext);

        Extmgt.GetUserDataOfExtension(req.params.Ext,Company,Tenant,reqId,function (err, resz) {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR/Exception", false, undefined);
                logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(undefined, "Success", true,resz);
                logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
                res.end(jsonString);
            }
        });
    }
    catch(ex)
    {
        logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - [HTTP]  - Error in Request -  Data - %s',reqId,req.params.Ext,ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Exception", false, undefined);
        logger.debug('[DVP-SIPUserEndpointService.UsersOfExtension] - [%s] - Request response : %s ',reqId,jsonString);
        res.end(jsonString);
    }
    return next();


});

