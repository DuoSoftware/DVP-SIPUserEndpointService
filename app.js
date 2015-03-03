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



var RestServer = restify.createServer({
    name: "myapp",
    version: '1.0.0'
},function(req,res)
{

});
//Server listen
RestServer.listen(8080, function () {
    console.log('%s listening at %s', RestServer.name, RestServer.url);
});
//Enable request body parsing(access)
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());

//.......................................................................................................................

RestServer.post('/dvp/:version/context_mgmt/save_contextdata',function(req,res,err)
{
context.PostFunc(req,res,err);

});

//.......................................................................................................................

RestServer.post('/dvp/:version/uac_mgmt/save_uac',function(req,res,err)
{
    UACCreate.SaveSip(req,res,err);

});

//.......................................................................................................................

RestServer.post('/dvp/:version/uac_mgmt/updt_uac',function(req,res,err)
{
UACUpdate.UpdateUacUserData(req.body,res);

});

//.......................................................................................................................

RestServer.post('/dvp/:version/ext_mgmt/update_extension_st/:ref/:st',function(req,res,err)
{
    Extmgt.ChangeAvailability(req,res,err);


});

//.......................................................................................................................

RestServer.post('/dvp/:version/ext_mgmt/add_extension',function(req,res,err)
{
    Extmgt.AddExtension(req,res,err);


});

RestServer.post('/dvp/:version/ext_mgmt/map_extension',function(req,res,err)
{
    Extmgt.MapWithSipUacEndpoint(req,res,err);


});
//.......................................................................................................................

RestServer.post('/dvp/:version/sipgroup_mgt/sipuser_group/add_sipuser_group',function(req,res,err)
{
    group.AddSipUserGroup(req.body,res);

});
//.......................................................................................................................

RestServer.post('/dvp/:version/sipgroup_mgt/sipuser_group/map_extensionid',function(req,res,err)
{
    group.MapExtensionID(req.body,res);

});
//.......................................................................................................................

RestServer.post('/dvp/:version/sipgroup_mgt/sipuser_group/fill_usrgrp',function(req,res,err)
{
    group.FillUsrGrp(req.body,res);

});
//.......................................................................................................................

RestServer.post('/dvp/:version/sipgroup_mgt/sipuser_group/update_sipuser_group',function(req,res,err)
{
    group.UpdateSipUserGroup(req.body,res);

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

//.......................................................................................................................

RestServer.get('/dvp/:version/uac_mgmt/find_context/:cmpid',function(req,res,err)
{
    context.GetFunc(req.params.cmpid,res,err);


});


//.......................................................................................................................

RestServer.get('/dvp/:version/sipgroup_mgt/sipuser_group/get_group_data/:name',function(req,res,err)
{
    group.GetGroupData(req.params.name,res);
    return next();


});
//.......................................................................................................................

RestServer.get('/dvp/:version/sipgroup_mgt/sipuser_group/get_group_endpoints',function(req,res,err)
{
    group.GetGroupEndpoints(req.body,res);

});

//.......................................................................................................................

RestServer.get('/dvp/:version/sipgroup_mgt/sipuser_group/endpoint_groupid',function(req,res,err)
{
    group.EndpointGroupID(req.body,res);
    return next();
});

//.......................................................................................................................

RestServer.get('/dvp/:version/sipgroup_mgt/sipuser_group/AllRecWithCompany/:CompanyId',function(req,res,err)
{
    group.AllRecWithCompany(req.params.CompanyId,res,err);



});
//.......................................................................................................................

RestServer.get('/dvp/:version/sipgroup_mgt/sipuser_group/get_all_users_in_group/:companyid',function(req,res,err)
{

    group.GetAllUsersInGroup(req.params.companyid, res, err);



});






sre.init(RestServer, {
        resourceName : 'SIPUserEndpoint',
        server : 'restify', // or express
        httpMethods : ['GET', 'POST', 'PUT', 'DELETE'],
        basePath : 'http://localhost:8080',
        ignorePaths : {
            GET : ['path1', 'path2'],
            POST : ['path1']
        }
    }
)
