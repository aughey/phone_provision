var express = require('express');
var app = express();
var Q = require("q");
var fs = require('fs');
var Mustache = require('mustache');

function generateConfig(mac,path) {
  return Q.fcall(function() {
    var template = fs.readFileSync("template.mustache").toString();
    var out = Mustache.render(template,{mac:mac,extension:006});
    fs.writeFileSync(path,out);
    return true;
  });
}

// respond with "hello world" when a GET request is made to the homepage
var configre = /^\/config\/cfg([a-z0-9]+)\.xml$/
app.get(configre, function(req, res) {
  var path = __dirname + "/html" + req.originalUrl;
  if(fs.existsSync(path)) {
    res.sendFile(path);
    return;
  }
  var mac = req.originalUrl.match(configre);
  var mac = mac[1];
  if(!mac) {
    req.status(404).end();
    return;
  }
  generateConfig(mac,path).then(function() {
    res.sendFile(path);
  }).done();
});

app.use(express.static('html'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
