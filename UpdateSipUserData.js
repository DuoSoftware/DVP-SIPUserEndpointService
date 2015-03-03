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

//var SaveNewSipUser=function(UContext,UDescription,UCompanyId,UTenantId,UObjClass,UObjType,UObjCategory,UAddUser,UUpdateUser,UAddTime,UUpdateTime,callback)

// Save function , 2 params, object from caller and this functions callback

// post :- done
function UpdateUacUserData(jobj,callback) {
    // Add all  details of new user

    DbConn.SipUACEndpoint
        .find({ where: [{ SipUsername: jobj.SipUsername },{CompanyId:jobj.CompanyId},{TenantId:jobj.TenantId}]})
        .complete(function(err, result) {
            if (!!err) {
                console.log('................An error occurred while searching for SIp UAC Record..................', err);
                callback.end();

            } else if (!result) {


                console.log('No user has been found.');
                callback.end();

            }
            else
            {


                DbConn.SipUACEndpoint
                    .updateAttributes(
                    {
                        Password: jobj.Password,
                        GuRefId: jobj.GuRefId,
                        ObjClass: jobj.ObjClass,
                        ObjType: jobj.ObjType,
                        ObjCategory: jobj.ObjCategory,
                        ExtraData:jobj.ExtraData

                    },
                    {
                        where: [{ SipUsername: jobj.SipUsername },{CompanyId:jobj.CompanyId},{TenantId:jobj.TenantId}]
                    }
                ).then(function() {

                        console.log(".......................Record updated successfully!....................");
                        callback.end();

                    }).error(function(err) {

                        console.log("Project update failed ! "+ err);
                        callback.end();
                        //handle error here

                    });

            }
        });
    return next();
}





//exporting module
module.exports.UpdateUacUserData = UpdateUacUserData;

