/**
 * Created by Administrator on 1/27/2015.
 */
//C:\DVP\DVP-SIPUsersEndpointService\DVP-Common\CSORMModels\CsDataModel.js

var DbConn = require('./DVP-DBModels');
var DbSave=require('./SaveSipUserData.js');
var restify = require('restify');
var strfy = require('stringify');
var winston=require('winston');


var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './ContextMgtLog.log' })

    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: './ContextMgtLogErr.log' })
    ]
});






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
//Enable request body parsing(access)
RestServer.use(restify.bodyParser());
RestServer.use(restify.acceptParser(RestServer.acceptable));
RestServer.use(restify.queryParser());

*/
//Post
//Request comes as body

//post :- done
function PostFunc(reqz,resz,errz)
{
    logger.info( 'Context Management is Starting.' );
    try {
        var obj = reqz.body;
        logger.info( 'Request : '+obj );

        //Add other vars to object




        obj.CompanyId = 1;
        obj.TenantId = 2;
        obj.AddUser = "NAddUser";
        obj.UpdateUser = "NUpdateUser";
        obj.AddTime = new Date(2013, 01, 13);
        obj.UpdateTime = new Date(2013, 01, 28);
        logger.info( 'After Object updation : '+obj );
    }
    catch (ex)
    {
        console.log("Error in adding new items to object created using request body");
        logger.info( 'Exception found in object creation : '+ex );
        reqz.end();

    }

   /* function SaveSt(error,st)
    {
       try {
           if (st && error == null) {
               console.log("New Record is Added Successfully");
           }
           else {
               console.log("New Record Saving Error " + error);
           }
       }
        catch (ex)
        {
           Console.log("Error found in Save status return : "+ex);
        }

    };

*/
    logger.info( 'Searching for record , Context :'+obj.Context );
    DbConn.Context
        .find({ where: { Context: obj.Context } })
        .complete(function(err, result) {
            if (!!err) {
                console.log('An error occurred while searching for Context:', err);

                logger.info( 'Error found in Searching , Context :'+obj.Context+' Error : '+err );
                resz.end();

            } else if (!result) {
                console.log('No user with the Context '+obj.Context+' has been found.');
                logger.info( 'No record Found , Context :'+obj.Context );

                try
                {

                    //DbSave.SaveNewSipUser(jobj.Context,jobj.Description,1,2,jobj.ObjClass,jobj.ObjType,jobj.ObjCategory,"AddUser1","UpdateUSer1",new Date(2015,01,12),new Date(2015,01,26),SaveSt);

                    //call external save function, params = Json object and callback function

                   // DbSave.SaveNewSipUser(obj,SaveSt);

                    logger.info( 'Entering new record for Context :'+obj.Context );
                    DbConn.Context
                        .create(
                        {
                            Context: obj.Context,
                            Description: obj.Description,
                            // ContextCat: Sequelize.STRING,
                            CompanyId: obj.CompanyId,
                            TenantId: obj.TenantId,
                            ObjClass: obj.ObjClass,
                            ObjType: obj.ObjType,
                            ObjCategory: obj.ObjCategory,
                            AddUser: obj.AddUser,
                            UpdateUser: obj.UpdateUser
                            // AddTime: jobj.AddTime,
                            // UpdateTime: jobj.UpdateTime,
                            //id: 1,
                            // createdAt: new Date(2009, 10, 11),
                            // updatedAt: new Date(2009, 10, 12)

                        }
                    ).complete(function (err, user) {
                            /* ... */
                            if (err == null) {
                                console.log("New User Found and Inserted (Context : " + obj.Context + ")");
                                logger.info( 'Record inserted' );
                               // callback(err, true);
                                // pass null and true


                            }
                            else {
                                console.log("Error in saving  (Context :" + obj.Context + ")" + err);
                                logger.info( 'Error in saving , Context :'+obj.Context );
                             //   callback(err, false);
                                //pass error and false
                            }
                        });




                }
                catch(ex)
                {
                    console.log("An error occurred in data saving process ");
                    logger.info( 'Exception Found in saving , Exception :'+ex );

                }
                resz.end();
            } else {
                console.log('Context Found ' + result.Context + '!');
                console.log('All attributes of Context:', result.values);
                logger.info( 'Record is already in db  :'+obj.Context );

                DbConn.Context
                    .update(
                    {
                        Description: obj.Description,
                        // ContextCat: Sequelize.STRING,
                        CompanyId: obj.CompanyId,
                        TenantId: obj.TenantId,
                        ObjClass: obj.ObjClass,
                        ObjType: obj.ObjType,
                        ObjCategory: obj.ObjCategory,
                        AddUser: obj.AddUser,
                        UpdateUser: obj.UpdateUser
                      //  AddDate:obj.AddTime,
                       // UpdateDate: obj.UpdateTime,
                       // createdAt:new Date(2009,10,11),
                        //updatedAt:new Date(2009,10,12)
                    },
                    {
                        where:

                        {
                            Context:obj.Context
                        }
                    }
                ).then(function() {

                        console.log("Updated successfully!");
                        logger.info( 'Record Updated Successfully' );
                        resz.end();

                    }).error(function(err) {

                        console.log("Project update failed !");
                        logger.info( 'Record Updation failed : '+err );
                        resz.end();
                        //handle error here

                    });

            }
        });



}

//get :- done
function GetFunc(reqz,resz,errz)
{
    try {

        DbConn.Context
            // .find({ where: { Context: req.params.context } })
            .findAll({where: {CompanyId: reqz}})
            .complete(function (err, result) {

                if (!!err) {
                    console.log('An error occurred while searching for Context:', err)
                    // res.end();
                    resz.end();
                } else if (!result) {
                    //console.log('No user with the Context '+reqz.params.context+' has been found.');

                    // res.end();
                     resz.end();
                }
                else {
                    // console.log('Context Found ' + result.Context + '!');
                    //console.log('All attributes of Context:', result.values);
                   try {

                       var Jresults = result.map(function (result) {
                           console.log(result);
                           return result.toJSON();

                       });
                   }
                    catch (ex)
                    {
                        console.log("Error in creating json object to return : "+ex);
                        resz.end();
                    }
                    /*
                     for(var i=result.length;i>=0;i--)
                     {

                     console.log('\n new result found  '+Jresults+'\n');
                     }*/


                    // set as Json Object



                }
            });
    }
    catch (ex)
    {
        console.log("Error in searching data : "+ex);
    }
   resz.end();
}


/*
RestServer.post('/dvp/:version/save_contextdata',function(req,res,err)
{

    PostFunc(req,res,err);

   // res.end();
    return next();

});
*/

/*
RestServer.get('/dvp/:version/get_contextdata',function(req,res,err)
{
    GetFunc(req,res,err);


});

*/
module.exports.PostFunc = PostFunc;
module.exports.GetFunc = GetFunc;

