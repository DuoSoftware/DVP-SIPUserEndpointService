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
        "port": "SYS_REDIS_PORT"

    },

    "Kamailio":
    {
        "User":"SYS_KAMAILIODB_USER",
        "Password":"SYS_KAMAILIODB_PASSWORD",
        "Host":"SYS_KAMAILIODB_HOST",
        "Database":"SYS_KAMAILIODB_DATABASE"
    },

    "Host":
    {
        "domain": "HOST_NAME",
        "port": "HOST_SIPUSERENDPOINT_PORT",
        "version": "HOST_VERSION"
    }
};

//NODE_CONFIG_DIR