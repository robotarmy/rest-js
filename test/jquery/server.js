var sys = require('sys'), 
    http = require('http'),
    URL = require('url'),
    posix = require('posix');

var file_resources = {
  '/jquery-1.4.1.js': 'libs/jquery-1.4.1.js',
  '/qunit.js': 'test/qunit/qunit.js',
  '/qunit.css': 'test/qunit/qunit.css',
  '/tests.js': 'test/jquery/tests.js',
  '/tests': 'test/jquery/tests.html',
};

http.createServer(function (req, res) {
  var url = URL.parse(req.url, parseQueryString=true);
  
  if(url.pathname in file_resources){
    var path = file_resources[url.pathname];
    var type;
    if(path.match(/\.js$/)) type = {'Content-Type': 'application/javascript'};
    else if(path.match(/\.css$/)) type = {'Content-type': 'text/css'};
    else if(path.match(/\.html$/)) type = {'Content-Type': 'text/html'}
    else type = {};
    res.sendHeader(200, type);
    posix.cat(path).addCallback(function(content){
      res.sendBody(content, encoding="utf-8");
      res.finish();
    });
  }
  else {
    var code = 200;
    if(url.query && url.query.code) code = parseInt(url.query.code);
    res.sendHeader(code, {'Content-Type': 'text/html'});
    res.sendBody('Hello');
    res.finish();
  }

}).listen(8001);

sys.puts('Server running at http://127.0.0.1:8001/');

