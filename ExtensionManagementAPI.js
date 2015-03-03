/**
 * Created by pawan on 2/6/2015.
 */

var DbConn = require('./DVP-DBModels');
var DbSave=require('./SaveSipUserData.js');
var restify = require('restify');
var winston=require('winston');

/*

 // Create Restify Server
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

 */




var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './ExtMgtLog.log' })

    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './ExtMgtLogErr.log' })
    ]

});







//post:-done
function ChangeAvailability(reqz,resz,errz)
{
    logger.info( 'Start of Extension availability changing ');
    var status = 0;
    DbConn.Extension.find({ where: { ExtRefId: reqz.params.ref }}).complete(function(err, ExtObject) {
        logger.info( 'Requested RefID: '+reqz.params.ref);
        // console.log(ExtObject);
        if(!ExtObject)
        {
            console.log("No record found for the RefId : "+reqz.params.ref);
            logger.info( 'No record for  RefID: '+reqz.params.ref);
            resz.end();
        }

        else if(!err ) {
            logger.info( 'Updating Availability , RefID :' +reqz.params.ref);
            ExtObject.updateAttributes({

                Enabled:reqz.params.st

            }).success(function (err) {
                if (err) {
                    console.log("Extension update false ->", err);
                    logger.info( 'Error found in Updating : ' +err);
                    resz.end();
                } else {
                    status = 1;
                    console.log("Extension updated successfully");
                    logger.info( ' Updated Successfully' );
                    resz.end();
                    // res.end();
                    // console.log(affrws);
                }


                try {

                    resz.send(status);
                    resz.end();

                }
                catch (exp) {

                    console.log("There is a error in --> Update Activate status ", exp);
                    logger.info( 'Exception Found in Updating : '+exp );

                }

            })
        }
        else
        {
            resz.send(status);
            resz.end();

        }

    });
    return next();
}
/*
 RestServer.post('/dvp/:version/update_extension_st/:ref/:st',function(req,res,err)
 {

 ChangeAvailability(req,res,err);


 return next();

 });
 */
function AddExtension(reqz,resz,errz)
{
    logger.info( 'Starting new Extension creation .');
    var obj = reqz.body;
    logger.info( 'Request json body  is converted as object : '+obj);
    DbConn.Extension.find({ where:[ { Extension: obj.Extension },{CompanyId:obj.CompanyId},{TenantId : obj.TenantId}]}).complete(function(err, ExtObject) {

        logger.info( 'Searching Extension : '+obj.Extension+' CompanyID : '+obj.CompanyId+' TenentID : '+obj.TenantId);

        // console.log(ExtObject);
        if(!!err)
        {
            console.log("An error occurred in searching Extension : "+obj.Extension);
            logger.info( 'Saving error. ');
            resz.end();
        }


        else if(!ExtObject)
        {
            console.log("No record found for the Extension : "+obj.Extension);
            logger.info( 'No record Found. Extension : '+obj.Extension);

            CreateExtension(obj);
            resz.end();



        }

    });
    return next();
}

function MapWithSipUacEndpoint(reqz,resz,errz)
{

logger.info('Starting mapping.(SipUAC Endpoint and Extension.)');

    var obj = reqz.body;
    logger.info('Request body json converts as object : '+obj.values);

    DbConn.Extension.find({ where:[ { id: obj.Extensionid }]}).complete(function(err, ExtObject) {



        // console.log(ExtObject);
        if(!!err)
        {
            console.log("An error occurred in searching Extension : "+obj.Extensionid);
            logger.info('Error occurred in Searching Extension : '+obj.Extensionid+' Error : '+err);
            resz.end();
        }


        else if(!ExtObject)
        {
            console.log("No record found for the Extension : "+obj.Extensionid);
            logger.info('No record for Extension : '+obj.Extensionid);
            resz.end();


        }
        else
        {
            logger.info('Searching for SipUACEndpoint : '+obj.UACid);
            DbConn.SipUACEndpoint.find({ where:[ { id: obj.UACid }]}).complete(function(err, SipObject) {



                // console.log(ExtObject);
                if(!!err)
                {
                    logger.info('Error in Searching for SipUACEndpoint : '+obj.UACid);
                    console.log("An error occurred in searching Extension : "+obj.Extension+' error : '+err);
                    resz.end();
                }


                else if(!ExtObject)
                {
                    logger.info( 'SipUACEndpoint not found: ' +obj.UACid);
                    console.log("No record found for the Extension : "+obj.Extension);
                    resz.end();

                }
                else
                {
                    logger.info( 'Both SipUAC : '+obj.UACid+' and Extension : '+obj.Extensionid+' found.');
                    /*  ExtObject.addSipUACEndpoint(SipObject).complete(function (errx, CloudEndInstancex)
                     {
                     console.log("...........................Mapping is succeeded ...................");
                     });
                     */

                    DbConn.SipUACEndpoint
                        .update(
                        {
                            ExtensionId: obj.Extensionid


                        },
                        {
                            where: [{ id: obj.Sipid }]
                        }
                    ).then(function() {
                            logger.info( 'Successfully Mapped. ');
                            console.log(".......................mapping is succeeded ....................");
                            resz.end();

                        }).error(function(err) {
                            logger.info( 'mapping error found in saving. : '+err);
                            console.log("mapping failed ! "+ err);
                            //handle error here
                            resz.end();

                        });
                }

            });
        }

    });

    return next();
}


function CreateExtension(jobj)
{
    logger.info( 'Saving new Extension.. ');
    try{
        DbConn.Extension
            .create(
            {
                Extension: jobj.Extension,
                ExtensionName: jobj.ExtensionName,
                Enabled: jobj.Enabled,
                ExtraData: jobj.ExtraData,
                ExtRefId: jobj.ExtRefId,
                CompanyId: jobj.CompanyId,
                TenantId: jobj.TenantId,
                ObjClass: jobj.ObjClass,
                ObjType: jobj.ObjType,
                ObjCategory: jobj.ObjCategory,
                AddUser: jobj.AddUser,
                UpdateUser: jobj.UpdateUser



            }
        ).complete(function (err, user) {
                /* ... */


                if (err == null) {
                    console.log("New User Found and Inserted (Extension : " + jobj.Extension + ")");
                    logger.info( 'Extension is created. values : '+jobj);
                    //callback(err, true);
                    // pass null and true


                }
                else {
                    console.log("Error in saving  (Context :" + jobj.Context + ")" + err);
                    logger.info( 'Error Found in Saving  : '+err);
                    // callback(err, false);
                    //pass error and false
                }
            });

    }
    catch (ex)
    {
        console.log("Error found in saving data : "+ex);
        logger.info( 'Exception Found in Saving  : '+ex);
    }

}


module.exports.ChangeAvailability = ChangeAvailability;
module.exports.AddExtension = AddExtension;
module.exports.MapWithSipUacEndpoint = MapWithSipUacEndpoint;