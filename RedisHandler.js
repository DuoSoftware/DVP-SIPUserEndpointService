var redis = require("ioredis");
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;



var redisSetting =  {
    port:redisport,
    host:redisip,
    family: 4,
    password: redispass,
    db: redisdb,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {

        return true;
    }
};

if(redismode == 'sentinel'){

    if(config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port, config.Redis.sentinels.name){
        var sentinelHosts = config.Redis.sentinels.hosts.split(',');
        if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
            var sentinelConnections = [];

            sentinelHosts.forEach(function(item){

                sentinelConnections.push({host: item, port:config.Redis.sentinels.port})

            })

            redisSetting = {
                sentinels:sentinelConnections,
                name: config.Redis.sentinels.name,
                password: redispass
            }

        }else{

            console.log("No enough sentinel servers found .........");
        }

    }
}

var client = undefined;

if(redismode != "cluster") {
    client = new redis(redisSetting);
}else{

    var redisHosts = redisip.split(",");
    if(Array.isArray(redisHosts)){


        redisSetting = [];
        redisHosts.forEach(function(item){
            redisSetting.push({
                host: item,
                port: redisport,
                family: 4,
                password: redispass});
        });

        var client = new redis.Cluster([redisSetting]);

    }else{

        client = new redis(redisSetting);
    }


}



var SetObjectWithExpire = function(key, value, timeout, callback)
{
    try
    {
        client.setex(key, timeout, value, function(err, response)
        {
            if(err)
            {
                logger.error('[DVP-SIPUserEndpointService.SetObjectWithExpire] - REDIS ERROR', err)
            }
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }

};

var GetObjectParseJson = function(reqId, key, callback)
{
    GetObject(reqId, key, function(err, resp)
    {
        if(err || !resp)
        {
            callback(err, null);
        }
        else
        {
            try
            {
                var jsonObj = JSON.parse(resp);
                callback(null, jsonObj);
            }
            catch(ex)
            {
                callback(ex, null);
            }

        }
    })
}

var GetObject = function(reqId, key, callback)
{
    try
    {
        var start = new Date().getTime();
        client.get(key, function(err, response)
        {
            var end = new Date().getTime();
            var time = end - start;

            console.log("Redis Time : " + time);
            if(err)
            {
                logger.error('[DVP-SIPUserEndpointService.GetObject] - [%s] - REDIS GET failed', reqId, err);
            }

            callback(err, response);
        });

    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.GetObject] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }
};

var SetObject = function(key, value, callback)
{
    try
    {
        client.set(key, value, function(err, response)
        {
            if(err)
            {
                logger.error('[DVP-SIPUserEndpointService.SetObjectWithExpire] - REDIS ERROR', err)
            }
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }

};

var DeleteObject = function(key, callback)
{
    try
    {
        client.del(key, function(err, response)
        {
            if(err)
            {
                logger.error('[DVP-SIPUserEndpointService.SetObjectWithExpire] - REDIS ERROR', err)
            }
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }

};

var PublishToRedis = function(pattern, message, callback)
{
    try
    {
        var result = client.publish(pattern, message);
            logger.debug('[DVP-SIPUserEndpointService.SetObjectWithExpire] - REDIS SUCCESS');
            callback(undefined, true);
       
    }
    catch(ex)
    {
        callback(ex, undefined);
    }
}

var GetFromSet = function(setName, callback)
{
    try
    {
       client.smembers(setName).keys("*", function (err, setValues)
            {
                if(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.SetObjectWithExpire] - REDIS ERROR', err)
                }
                callback(err, setValues);
            });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }
};

var IncrementKey = function(key, callback)
{
    try
    {
         client.incr(key, function (err, reply)
            {
                if(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.IncrementKey] - [%s] - REDIS ERROR', err);
                }

            });
    }
    catch(ex)
    {
        logger.error('[DVP-SIPUserEndpointService.IncrementKey] - [%s] - REDIS ERROR', ex);
    }
};

var AddChannelIdToSet = function(uuid, setName)
{
    try
    {
       client.sismember(setName, uuid, function (err, reply)
            {
                if(err)
                {
                    logger.error('[DVP-SIPUserEndpointService.AddChannelIdToSet] - [%s] - REDIS ERROR', err);
                }
                else
                {
                    if (reply === 0)
                    {
                        client.sadd(setName, uuid);
                    }

                }


            });

    }
    catch(ex)
    {
        logger.error('[DVP-EventMonitor.AddChannelIdToSet] - [%s] - REDIS ERROR', ex);

    }

}

var AddToHash = function(hashId, key, value, callback)
{
    try
    {
        client.hset(hashId, key, value, function (err, reply)
            {
                if(err)
                {
                    logger.error('[DVP-DynamicConfigurationGenerator.AddToHash] - [%s] - REDIS ERROR', err);
                }

                callback(err, reply);

            });

    }
    catch(ex)
    {
        logger.error('[DVP-DynamicConfigurationGenerator.AddToHash] - [%s] - REDIS ERROR', ex);
    }
};

client.on('error', function(msg)
{

});

module.exports.SetObject = SetObject;
module.exports.PublishToRedis = PublishToRedis;
module.exports.GetFromSet = GetFromSet;
module.exports.SetObjectWithExpire = SetObjectWithExpire;
module.exports.GetObject = GetObject;
module.exports.AddChannelIdToSet = AddChannelIdToSet;
module.exports.GetObjectParseJson = GetObjectParseJson;
module.exports.IncrementKey = IncrementKey;
module.exports.AddToHash = AddToHash;
module.exports.DeleteObject = DeleteObject;
module.exports.redisClient = client;
