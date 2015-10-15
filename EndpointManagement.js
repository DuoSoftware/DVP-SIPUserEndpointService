/**
 * Created by Pawan on 8/10/2015.
 */

var DbConn = require('dvp-dbmodels');

function AddEndPoint(req,Company,Tenant,reqId,callback)
{
    try
    {
        var num=req.AreaCode.concat(req.Phone) ;

        if(PhoneNumberValidation(num))
        {

            DbConn.SipUACEndpoint.find({where:[{SipUsername:req.SipUsername}]}).then(function(resSip)
            {
                if(!resSip)
                {
                    callback(new Error("No User Found"),undefined);
                }
                else
                {
                    var EndPointObj = DbConn.Endpoint
                        .build(
                        {
                            Phone:req.Phone,
                            AreaCode:req.AreaCode,
                            Availability: false,
                            CompanyId: Company,
                            TenantId: Tenant,
                            ObjClass: "OBJCLZ",
                            ObjType: "PUBLIC",
                            ObjCategory: "OBJCAT"


                        }
                    );
                    EndPointObj.save().then(function (resSave) {


                        resSip.addEndpoint(resSave).then(function(resMap)
                        {
                            callback(undefined,resMap);
                        }).catch(function(errMap)
                        {
                            callback(errMap,undefined);
                        });


                    }).catch(function (errSave) {


                        callback(errSave, undefined);
                    });
                }

            }).catch(function(errSip)
            {

                callback(errSip,undefined);
            });

        }
        else
        {
            callback(new Error("Invalid PhoneNumber"),undefined);
        }
    }
    catch(ex)
    {
        callback(ex,undefined);
    }




}

function EndpointAvailabilityUpdation(User,Phone,St,reqId,callback)
{
    try
    {
        DbConn.Endpoint.update({Availability:St},{where:[{SipUACEndpointId:User},{Phone:Phone}]}).then(function(resUpdate)
        {
            callback(undefined,resUpdate);
        }).catch(function(errUpdate)
        {
            callback(errUpdate,undefined);
        });
    }
    catch(ex)
    {
        callback(ex,undefined);
    }


}

function RemoveEndpoint(User,Phone,reqId,callback)
{
    try
    {
        DbConn.Endpoint.destroy({where: [{SipUACEndpointId:User},{Phone:Phone},{Availability:false}]}).then(function (resDel)
        {
            callback(undefined,resDel);

        }).catch(function(errDel)
        {
            callback(errDel,undefined);
        });
    }
    catch(ex)
    {
        callback(ex,undefined);
    }

}

function AllEndpointsOfuser(User,reqId,callback)
{
    try
    {
        DbConn.Endpoint.findAll({include: [{model: DbConn.SipUACEndpoint, as: "SipUACEndpoint",where:[{SipUsername:User}]}]}).then(function(resEndPoints)
        {
            callback(undefined,resEndPoints);

        }).catch(function(errEndPoints)
        {
            callback(errEndPoints,undefined);
        });
    }
    catch(ex)
    {
        callback(ex,undefined);
    }

}

function GetEndpointDetails(User,phone,reqId,callback)
{
    try
    {
        DbConn.Endpoint.find({where:[{Phone:phone}],include: [{model: DbConn.SipUACEndpoint, as: "SipUACEndpoint",where:[{SipUsername:User}]}]})
            .then(function (resEndpoint) {

                callback(undefined,resEndpoint);

            }).catch(function(errEndpoint)
            {
                callback(errEndpoint,undefined);
            });
    }
    catch(ex)
    {
        callback(ex,undefined);
    }

}

function PhoneNumberValidation(Phone)
{
    //PhoneNumberFormat :- +94721389808
    try
    {
        var phoneno =/^\+?([0-9]{2})\)?([0-9]{9})$/;
        if((Phone.match(phoneno)))
        {
            return true;
        }
        else
        {

            return false;
        }
    }
    catch(ex)
    {
        return false;
    }


}


module.exports.AddEndPoint = AddEndPoint;
module.exports.EndpointAvailabilityUpdation = EndpointAvailabilityUpdation;
module.exports.RemoveEndpoint = RemoveEndpoint;
module.exports.AllEndpointsOfuser = AllEndpointsOfuser;
module.exports.GetEndpointDetails = GetEndpointDetails;
module.exports.PhoneNumberValidation = PhoneNumberValidation;