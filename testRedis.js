var redis = require('redis');
var client = redis.createClient(6379, 'localhost');
client.select(13);

client.LRANGE("Success_2014-01-21", 0, -1, function(e, r){
    console.log(r);
    });
