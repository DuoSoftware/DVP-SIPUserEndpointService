module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"104.236.231.11",
    "Database":"duo"
  },

  "Redis":
  {
    "ip": "45.55.142.207",
    "port": 6389,
    "password":"DuoS123",
    "db": 9,
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
      "port":16389,
      "name":"redis-cluster"
    }
  },

  "Security":
  {
    "ip" : "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "mode":"sentinel",//instance, cluster, sentinel
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
      "port":16389,
      "name":"redis-cluster"
    }
  },

  "Mongo":
  {
    "ip":"104.236.231.11",
    "port":"27017",
    "dbname":"dvpdb",
    "password":"DuoS123",
    "user":"duo",
    "replicaset" :"104.236.231.11"
  },

  "Kamailio":
  {
    "User":"root",
    "Password":"DuoS123",
    "Host":"104.131.105.222",
    "Database":"kamailio",
    "Port":"3306"
  },

  "Host":
  {
    "domain": "0.0.0.0",
    "port": 8086,
    "version":"1.0.0.0",
    "encryptionPassword": "DuoS123"
  }
};
