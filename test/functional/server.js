var sys = require('sys'), 
    http = require('http'),
    URL = require('url'),
    posix = require('posix');

var file_resources = {
  '/json2.js': 'libs/json2.js',
  '/rest.js': 'rest.js',
  '/schema.js': 'test/functional/schema.js',
  '/jquery-1.4.1.js': 'libs/jquery-1.4.1.js',
  '/qunit.js': 'test/qunit/qunit.js',
  '/qunit.css': 'test/qunit/qunit.css',
  '/tests_server.js': 'test/functional/tests_server.js',
  '/tests.js': 'test/functional/tests.js',
  '/tests': 'test/functional/tests.html',
};

var DATA = {
  p1: {
    id: 1,
    firstname: "Calypso",
    friends: [{id:1}, {id:2}, {id:3}],
  },

  p2: {
    id: 2,
    firstname: "P",
    friends: [{id:1}],
  },

  p3: {
    id: 3,
    firstname: "Zeus",
    friends: [],
  },

  p4: undefined,
};
var ORIGINAL_DATA = {};
process.mixin(true, ORIGINAL_DATA, DATA);


var map = function(list, func) {
  var new_list = [];
  for(var i = 0; i<list.length; i++){
    var val = func && func(list[i]) || list[i];
    if (val) new_list.push(val);
  }
  return new_list;
}

function get_post_params(req, callback) {
  var body = "";
  req.setBodyEncoding('utf-8');
  req.addListener("body", function(chunk) { body += chunk; }).addListener("complete", function() {
    callback(body);
    //callback(unescape(body.replace(/\+/g," ")));
  });
}

http.createServer(function (req, res) {
  sys.puts(req.url);
  var url = URL.parse(req.url, parseQueryString=true);
  
  if(url.pathname in file_resources){
    var path = file_resources[url.pathname];
    var type;
    if(path.match(/\.js$/)) type = {'Content-Type': 'application/javascript'};
    else if(path.match(/\.css$/)) type = {'Content-type': 'text/css'};
    else if(path.match(/\.html$/)) type = {'Content-Type': 'text/html'}
    else type = {};
    //var fd = posix.open(path, process.O_RDONLY,'r');
    res.sendHeader(200, type);
    posix.cat(path).addCallback(function(content){
      res.sendBody(content, encoding="utf-8");
      res.finish();
    });
  }

  else if(url.pathname == '/tests/reinit_data'){
    sys.puts("Reinit the DATA");
    DATA = {};
    process.mixin(true, DATA, ORIGINAL_DATA);
    res.sendHeader(200, {'Content-Type': 'text/html'});
    res.sendBody('Data re initialized');
    res.finish();
  }

  else if(url.query && url.query.error_){
    // We want to simulate an error
    res.sendHeader(500);
    res.sendBody('1');
    res.finish();
  }

  else if(reg_res = url.pathname.match(/^\/people\/(\d+(,\d+)*)?$/)){
    sys.puts(JSON.stringify(reg_res));
    if(reg_res[1] === undefined){
      
      if(req.method == 'GET'){// index
        res.sendHeader(200, {'Content-Type': 'application/json'});
        var offset, limit;
        if(url.query) {
          offset = url.query.offset || 0;
          limit = url.query.limit;
        }
        var items = map([DATA.p1, DATA.p2, DATA.p3, DATA.p4], null);
        var total = items.length;
        items = items.splice(offset);
        if(limit) items.length = Math.min(items.length, limit);
        res.sendBody(JSON.stringify({
          items: items,
          from: offset + 1,
          to: offset + items.length,
          total: total,
        }));
        res.finish();
      }

      else { // Post
        get_post_params(req, function(data){
          sys.puts(data);
          data = JSON.parse(data);
          if(!data || !data.firstname || // bad data
             DATA.p4){ // No new Person accepted anymore
            res.sendHeader(403);
            res.sendBody('1');
            res.finish();
          }
          else {
            data.id = 4;
            if(data.mother == undefined) data.mother = null;
            if(data.friends == undefined) data.friends = [];
            DATA.p4 = data;
            res.sendHeader(200, {'Content-Type': 'application/json'});
            res.sendBody(JSON.stringify(data));
            res.finish();
          }
        });
      }
    }
    else { // id(s) given
      var id = parseInt(reg_res[1]);
      var ids = map(reg_res[1].split(','), parseInt);
      var person3 = false;

      for(i=0; i<ids.length; i++) {
        var id = ids[i];
        if(id==3) person3 = true;
        if(!DATA['p'+id]){
          res.sendHeader(404);
          res.sendBody('1');
          res.finish();
          return;
        }
      }
      sys.puts(ids);
      
      if(req.method == 'GET'){
        res.sendHeader(200, {'Content-Type': 'application/json'});
        var data = map(ids, function(id){return DATA['p'+id]});
        if(data.length == 1) data = data[0];
        res.sendBody(JSON.stringify(data));
        res.finish();
      }
      else get_post_params(req, function(data){
        if(person3){ // Dont't touch Person with id 3 !
          res.sendHeader(403);
          res.sendBody('1');
          res.finish();
          return;
        }
        data = JSON.parse(data);
        if(data.method_ == 'PUT'){
          map(ids, function(id){
            process.mixin(DATA['p'+id], data.data);
          });
          res.sendHeader(200);
          res.sendBody('1');
          res.finish();
        }
        else if(data.method_ == 'DELETE'){
          map(ids, function(id){
            delete DATA['p'+id];
          });
          res.sendHeader(200);
          res.sendBody('1');
          res.finish();
        }
      });
    }
  }

  else {
    res.sendHeader(404);
    res.sendBody('1');
    res.finish();
  }

}).listen(8000);

sys.puts('Server running at http://127.0.0.1:8000/');

