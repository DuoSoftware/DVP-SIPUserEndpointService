module.exports = {
    "DB": {
        "Type": "postgres",
        "User": "duo",
        "Password": "DuoS123",
        "Port": 5432,
        "Host": "104.236.231.11",
        "Database": "duo"
    },


    "Redis":
        {
            "mode": "sentinel",//instance, cluster, sentinel
            "ip": "45.55.142.207",
            "port": 6389,
            "user": "",
            "password": "",
            "sentinels": {
                "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
                "port": 16389,
                "name": "redis-cluster"
            }

        },

    "Security":
        {

            "ip": "45.55.142.207",
            "port": 6389,
            "user": "",
            "password": "",
            "mode": "sentinel",//instance, cluster, sentinel
            "sentinels": {
                "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
                "port": 16389,
                "name": "redis-cluster"
            }
        },

    "Mongo":{
        ip: "",
        port: "",
        dbname: "",
        password: "",
        user: "",
        type: "mongodb+srv",
    },

    "Kamailio":
        {
            "User": "",
            "Password": "",
            "Host": "",
            "Database": "",
            "Port": "3306"
        },

    "Host":
        {
            "domain": "0.0.0.0",
            "port": 8086,
            "version": "1.0.0.0",
            "encryptionPassword": ""
        }
};
