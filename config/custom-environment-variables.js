module.exports = {
    "DB": {
        "Type":"SYS_DATABASE_TYPE",
        "User":"SYS_DATABASE_POSTGRES_USER",
        "Password":"SYS_DATABASE_POSTGRES_PASSWORD",
        "Port":"SYS_SQL_PORT",
        "Host":"SYS_DATABASE_HOST",
        "Database":"SYS_DATABASE_POSTGRES_USER"
    },


    "Redis":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "password": "SYS_REDIS_PASSWORD"

    },

    "Security":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD"

    },

    "Kamailio":
    {
        "User":"SYS_LBDATABASE_MYSQL_USER",
        "Password":"SYS_LBDATABASE_MYSQL_PASSWORD",
        "Host":"SYS_LBDATABASE_HOST",
        "Port":"SYS_LBMYSQL_PORT",
        "Database":"SYS_LBDATABASE_MYSQL_DB"
    },

    "Host":
    {
        "domain": "HOST_NAME",
        "port": "HOST_SIPUSERENDPOINTSERVICE_PORT",
        "version": "HOST_VERSION"
    }
};

//NODE_CONFIG_DIR
