/**
 * Created by pawan on 2/9/2015.
 */

/**
 * Created by pawan on 2/2/2015.
 */

/**
 * Created by Administrator on 1/27/2015.
 */
var DbConn = require('./DVP-DBModels');
var messageFormatter = require('./DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

//var SaveNewSipUser=function(UContext,UDescription,UCompanyId,UTenantId,UObjClass,UObjType,UObjCategory,UAddUser,UUpdateUser,UAddTime,UUpdateTime,callback)

// Save function , 2 params, object from caller and this functions callback

// post :- done
function UpdateUacUserData(jobj,callback) {
    // Add all  details of new user
try{
    DbConn.SipUACEndpoint
        .find({where: [{SipUsername: jobj.SipUsername}, {CompanyId: jobj.CompanyId}, {TenantId: jobj.TenantId}]})
        .complete(function (err, result) {
            if (!!err) {
                console.log('................An error occurred while searching for SIp UAC Record..................', err);
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                callback.end(jsonString);

            } else if (result.length==0) {


                console.log('No user has been found.');
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                callback.end(jsonString);

            }
            else {

                try {

                    DbConn.SipUACEndpoint
                        .update(
                        {
                            Password: jobj.Password,
                            GuRefId: jobj.GuRefId,
                            ObjClass: jobj.ObjClass,
                            ObjType: jobj.ObjType,
                            ObjCategory: jobj.ObjCategory,
                            ExtraData: jobj.ExtraData

                        },
                        {
                            where: [{SipUsername: jobj.SipUsername}, {CompanyId: jobj.CompanyId}, {TenantId: jobj.TenantId}]
                        }
                    ).then(function (result) {

                            console.log(".......................Record updated successfully!....................");
                            var jsonString = messageFormatter.FormatMessage(err, "SUCCESS", true, result);
                            callback.end(jsonString);

                        }).error(function (err) {

                            console.log("Project update failed ! " + err);
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                            callback.end(jsonString);
                            //handle error here

                        });

                }
                catch(ex)
                {
                    var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
                    callback.end(jsonString);
                }
            }


        });
    //return next();
}
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, null);
        callback.end(jsonString);
    }
}





//exporting module
module.exports.UpdateUacUserData = UpdateUacUserData;

