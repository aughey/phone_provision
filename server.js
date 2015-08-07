var express = require('express');
var app = express();
var Q = require("q");
var fs = require('fs');
var Mustache = require('mustache');
var _ = require('underscore');
var morgan = require('morgan');

app.use(morgan('combined'));

var state = {
  next_available: 5,
  mapping: {
    "00:0b:82:5e:06:2d": {
      extension: 1
    },
    "00:0b:82:5e:05:c5": {
      extension: 2
    },
    "30:b5:c2:33:11:b8": {
      extension: 3
    },
    "00:0b:82:5e:03:a7": {
      extension: 4
    }
  }
};

try {
  state = JSON.parse(fs.readFileSync("state.json").toString());
} catch(e) {
  console.log("Couldn't parse state.json");
  console.log(e);
//  process.exit(1);
}

function mac_to_colon(mac) {
  mac = mac.toString();
  var index = 0;
  var newmac = [];
  while(index < mac.length) {
    newmac.push(mac.slice(index,index+2));
    index += 2;
  }
  return newmac.join(':');
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function need_to_generate(mac,path) {
  var cmac = mac_to_colon(mac);
  if(!state.mapping[cmac]) {
    console.log("No known mapping for " + cmac);
    return true;
  }
  if(!fs.existsSync(path)) {
    console.log("Configuration file doesn't exists for " + cmac);
    return true;
  }
  var stat = fs.statSync(path);
  if(state.mapping[cmac].ctime != stat.ctime.toString()) {
    console.log("Ctime is different for " + cmac);
    return true;
  }
  return false;
}

function generateConfig(mac,path) {
    var deferred = Q.defer();

    cmac = mac_to_colon(mac);
    console.log("Generating configuration for " + cmac);

    var mapping = state.mapping[cmac];
    if(!mapping) {
      mapping = {
        extension: state.next_available
      }
      state.next_available+=1;
      state.mapping[cmac] = mapping;
      console.log("  New extension given: " + mapping.extension);
    }

    var template = fs.readFileSync("template.mustache").toString();
    var out = Mustache.render(template,{mac:mac,extension:pad(mapping.extension,3)});
    fs.writeFileSync(path,out);

    var stat = fs.statSync(path);
    mapping.ctime = stat.ctime.toString();

    fs.writeFileSync("state.json",JSON.stringify(state,null," "));
    
    deferred.resolve(true);

    return deferred.promise;
}

// respond with "hello world" when a GET request is made to the homepage
var configre = /^\/config\/cfg([a-z0-9]+)\.xml$/
app.get(configre, function(req, res,next) {
  var path = __dirname + "/html" + req.originalUrl;

  var mac = req.originalUrl.match(configre);
  var mac = mac[1];
  if(!mac) {
    req.status(404).end();
    next();
    return;
  }

  if(!need_to_generate(mac,path)) {
//    res.sendFile(path);
    next();
    return;
  }

  generateConfig(mac,path).then(function() {
 //   res.sendFile(path);
    next();
  }).done();
});

app.use(express.static('html'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
