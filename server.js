var irc = require('irc');
var sys = require('sys');
var config = require('./settings');

var mongoose = require('mongoose');
db = mongoose.connect(config.mongoserver);

mongoose.connection.on('open',function(){
        console.log('DB Connection Opened !!!');
});

var Schema = mongoose.Schema;

var URLtag= new Schema({
      tag       : String
});


var URLCapture = new Schema({
      url       : String,
      from      : String,
      tags      : [URLtag],
      captureDate: { type: Date, default: Date.now }
});

var capBase = mongoose.model('URLCapture',URLCapture);
var captureModel = mongoose.model('URLCapture');
var tagBase = mongoose.model('URLtag',URLtag);
var tagModel = mongoose.model('URLtag');

var client = new irc.Client(config.IRC.server, config.IRC.nick, {
    userName : config.IRC.userName,
    realName : config.IRC.realName,
    autoRejoin : true,
    channels: [config.IRC.channel],
});
client.addListener('message', function (from, to, message) {
    var url_match = /https?:\/\/([-\w.]+)+(:\d+)?(\/([\w/_.\-~#]*(\?\S+)?)?)?/gi
    var hash_match = /#(\w+)/gi;
    if(message.match(url_match)){
        var tags = message.match(hash_match),
            urls = message.match(url_match);
        
        urls.forEach(function(url,urlIndex){
            var post = new captureModel();
            if(tags){
                tags.forEach(function(myTag){
                   post.tags.push({tag:myTag});
                });
            }; 
            post.url = url_match.exec(message)[0]; 
            post.from = from;
            post.save(function (err) {
               if(err){
                   console.log(err);   
               };
            });
       });        
   }
});

client.addListener('pm', function (from, message) {
    if(message.toLowerCase().indexOf('all') === 0){
        capBase.find({},function(err,data){
            data.forEach(function(item,index){
                client.say(from,'URL : ' + item.url + ' From : '+ item.from);
            });
        });
    };
});
