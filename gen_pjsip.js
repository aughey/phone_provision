var Mustache = require('mustache');
var _ = require('underscore');
var fs = require('fs');

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var template = fs.readFileSync("pjsip.conf.mustache").toString();
var extensions = _.map(_.range(1,99), function(r) { return {extension: pad(r,3)}});
var out = Mustache.render(template,{extensions: extensions});
console.log(out);
