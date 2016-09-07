var config = require('config');
var redis = require('redis');

var client = redis.createClient(config.get('redis.port'), config.get('redis.hostname'));
client.on('connect', function() {
    console.log('Redis client connected at ' + config.get('redis.hostname') + ':' + config.get('redis.port'));
});

module.exports = client;