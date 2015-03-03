/**
 * Created by Administrator on 1/27/2015.
 */
var DbConn = require('./DVP-DBModels');

//var SaveNewSipUser=function(UContext,UDescription,UCompanyId,UTenantId,UObjClass,UObjType,UObjCategory,UAddUser,UUpdateUser,UAddTime,UUpdateTime,callback)

// Save function , 2 params, object from caller and this functions callback

var SaveNewSipUser=function(jobj,callback)
{
    // Add all  details of new user

try {
    DbConn.Context
        .create(
        {
            Context: jobj.Context,
            Description: jobj.Description,
            // ContextCat: Sequelize.STRING,
            CompanyId: jobj.CompanyId,
            TenantId: jobj.TenantId,
            ObjClass: jobj.ObjClass,
            ObjType: jobj.ObjType,
            ObjCategory: jobj.ObjCategory,
            AddUser: jobj.AddUser,
            UpdateUser: jobj.UpdateUser
           // AddTime: jobj.AddTime,
           // UpdateTime: jobj.UpdateTime,
            //id: 1,
           // createdAt: new Date(2009, 10, 11),
           // updatedAt: new Date(2009, 10, 12)

        }
    ).complete(function (err, user) {
            /* ... */
            if (err == null) {
                console.log("New User Found and Inserted (Context : " + jobj.Context + ")");

                callback(err, true);
                // pass null and true


            }
            else {
                console.log("Error in saving  (Context :" + jobj.Context + ")" + err);
                callback(err, false);
                //pass error and false
            }
        });

}
    catch (ex)
    {
        console.log("Error found in saving data : "+ex);
    }
};

//exporting module
module.exports.SaveNewSipUser = SaveNewSipUser;

