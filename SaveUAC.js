/**
 * Created by pawan on 2/2/2015.
 */

/**
 * Created by Administrator on 1/27/2015.
 */
var DbConn = require('DVP-DBModels');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var nodeUuid = require('node-uuid');

//var SaveNewSipUser=function(UContext,UDescription,UCompanyId,UTenantId,UObjClass,UObjType,UObjCategory,UAddUser,UUpdateUser,UAddTime,UUpdateTime,callback)

// Save function , 2 params, object from caller and this functions callback

function SaveUACRec(jobj,callback) {
    // Add all  details of new user

    if (jobj)
    {
        DbConn.CloudEndUser.find({where: [{ id: jobj.CSDBCloudEndUserId}]}).complete(function(err, cloudEndObject) {
            if (!err && cloudEndObject) {
                // console.log(cloudEndObject);

                 DbConn.Context.find({where: [{ Context: jobj.CSDBContextContext}]}).complete(function(err, ContextObject){

                if (!err && ContextObject) {

                    var sipUserUuid = nodeUuid.v1();

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
                            ObjClass: "OBJCLZ",
                            ObjType: "OBJTYP",
                            ObjCategory: "OBJCAT",
                            CompanyId: 1,
                            TenantId: 1,
                            AddUser: jobj.AddUser,
                            UpdateUser: jobj.UpdateUser
                            // AddTime: new Date(2009, 10, 11),
                            //  UpdateTime: new Date(2009, 10, 12),
                           // CSDBCloudEndUserId: jobj.CSDBCloudEndUserId


                        }
                    );

                    SIPObject.save().complete(function (err) {
                        if (!err) {
                             cloudEndObject.addSipUACEndpoint(SIPObject).complete(function (errx, CloudEndInstancex) {

                                 var status = 1;

                                 ContextObject.addSipUACEndpoint(SIPObject).complete(function (errx, ContextInstancex)
                                 {
                                     status = status++;
                                 });
                                 // res.write(status.toString());
                                 // res.end();
                             });

                            console.log("..................... Saved Successfully ....................................");

                        }
                        else
                        {
                            console.log("..................... Error found in saving....................................");
                        }

                            });

                            /*
                            ContextObject.addExtension(ExtensionObject).complete(function (errx, ContextInstancex)
                            {
                                status = status++;
                            });
                        }
                        else {

                            res.send(status.toString());
                            res.end();

                            console.log("Error on loadbalancer save --> ", err);

                        }


                    });*/


                }
                     else if(!ContextObject)
                {
                    console.log("................................... Given Context is invalid ................................ ");
                }
            });
        }
            else if(!cloudEndObject)
            {
                console.log("................................... Given Cloud End User is invalid ................................ ");
            }
            else{
                console.log("hhghg");
            }

        });
    }
    else{

        res.send(status.toString());
        res.end();
        console.log("obj is null in SetExtension");

    }
}

//exporting module
module.exports.SaveUACRec = SaveUACRec;

