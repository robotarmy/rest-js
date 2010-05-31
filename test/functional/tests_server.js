
(function(){

  // To make things easier:
  // The setup is reinitialized at the end of this block
  $.ajaxSetup({
   type: 'GET',
   cache: false
  });

  var reinit_server = function(){
    // Reinit state on server
    $.ajax({
      url: '/tests/reinit_data',
      type: 'GET',
			cache: false,
      async: false
    });
  };

  var lifecycle = {
    setup: reinit_server
  };

  $.postJSON = function(url, data, callback){
    return $.ajax({
      url: url,
      type: 'POST',
      dataType: 'json',
      data: data,
      success: callback
    });
  };

  $(document).ready(function(){

    module("test server", lifecycle);


    asyncTest("Index", 1, function(){
      $.getJSON('/people/',function(data){
        same(data, {
          "items":[
            {"id":1,"firstname":"Calypso","friends":[ {id:1}, {id:2}, {id:3}]},
            {"id":2,"firstname":"P","friends":[{id:1}]},
            {"id":3,"firstname":"Zeus","friends":[]}
          ],
          "from":1,
          "to":3,
          "total":3
        });
        start();
      });
      stop();
    });


    asyncTest("Index with offset and limit (1)", 1, function(){
      $.getJSON('/people/', {offset:1, limit: 1}, function(data){
        same(data, {
          "items":[
            {"id":2,"firstname":"P","friends":[{id:1}]}
          ],
          "from":2,
          "to":2,
          "total":3
        });
        start();
      });
      stop();
    });

    asyncTest("Index with offset and limit (2)", 1, function(){
      $.getJSON('/people/', {limit: 2}, function(data){
        same(data, {
          "items":[
            {"id":1,"firstname":"Calypso","friends":[ {id:1}, {id:2}, {id:3}]},
            {"id":2,"firstname":"P","friends":[{id:1}]}
          ],
          "from":1,
          "to":2,
          "total":3
        });
        start();
      });
      stop();
    });

    asyncTest("Index with offset and limit (3)", 1, function(){
      $.getJSON('/people/', {offset: 2}, function(data){
        same(data, {
          "items":[
            {"id":3,"firstname":"Zeus","friends":[]}
          ],
          "from":3,
          "to":3,
          "total":3
        });
        start();
      });
      stop();
    });


    asyncTest("GET (1)", 1, function(){
      $.getJSON('/people/1', function(data){
        same(data, {"id":1,"firstname":"Calypso","friends":[ {id:1}, {id:2}, {id:3}]});
        start();
      });
      stop();
    });

    asyncTest("GET (2)", 1, function(){
      $.getJSON('/people/3', function(data){
        same(data, {"id":3,"firstname":"Zeus","friends":[]});
        start();
      });
      stop();
    });

    asyncTest("GET on unexisting resource", 1, function(){
      $.ajax({
        url:'/people/66', 
        error: function(){
          ok(true, 'error');
          start();
        }
      });
      stop();
    });

    asyncTest("GET on multiple resources", 1, function(){
      $.getJSON('/people/1,2', function(data){
        same(data, [
          {"id":1,"firstname":"Calypso","friends":[ {id:1}, {id:2}, {id:3}]},
          {"id":2,"firstname":"P","friends":[{id:1}]}
        ]);
        start();
      });
      stop();
    });

    asyncTest("POST authorized", 2, function(){
      var expected =  {
        id: 4,
        firstname: 'Achile',
        friends: [{id:1}, {id:3}],
        mother: null
      };

      $.postJSON('/people/', JSON.stringify({
        firstname: 'Achile',
        friends: [{id:1}, {id:3}]
      }), function(data){
        same(data, expected);
        $.getJSON('/people/4', function(data){
          same(data, expected);
          start();
        });
      });
      stop();
    });

  
    asyncTest("POST error", 1, function(){
      $.ajax({
        url: '/people/?error_=1',
        type: 'POST',
        data: JSON.stringify({firstname: 'Arthur'}),
        error: function(){
          ok(true, 'error called');
          start();
        }
      });
      stop();
    });


    asyncTest("PUT authorized", 2, function(){
      var expected = {"id":2,"firstname":"Pierre","friends":[{id:1}]};
      $.postJSON('/people/2', JSON.stringify({
        method_: 'PUT',
        data: {firstname: 'Pierre'}
      }), function(){
        ok(true, "Put accepted")
        $.getJSON('/people/2', function(data){
          same(data, expected);
          start();
        });
      });
      stop();
    });


    asyncTest("PUT non authorized", 1, function(){
      $.ajax({
        url:'/people/3',
        type:'POST',
        dataType:'json',
        data: JSON.stringify({
          method_: 'PUT',
          data: {firstname: 'Appolon'}
        }),
        error: function(){
          ok(true, "Put Rejected")
          start();
        }
      });
      stop();
    });

    asyncTest("Multiple Put - authorized", 1, function(){
      $.ajax({
        url:'/people/1,2',
        type:'POST',
        data: JSON.stringify({
          method_: 'PUT',
          data: {firstname: "Ubiqutus", friends: []}
        }),
        success: function(){
          $.getJSON('/people/1,2', function(data){
            same(data, [
              {"id":1,"firstname":"Ubiqutus","friends":[]},
              {"id":2,"firstname":"Ubiqutus","friends":[]}
            ]);
            start();
          });
        }
      });
      stop();
    });


    asyncTest("Multiple Put - non authorized", 1, function(){
      $.ajax({
        url:'/people/2,3',
        type:'POST',
        data: JSON.stringify({
          method_: 'PUT',
          data: {firstname: "Ubiqutus", friends: []}
        }),
        error: function(){
          $.getJSON('/people/2,3', function(data){
            same(data, [
              {"id":2,"firstname":"P","friends":[{id:1}]},
              {"id":3,"firstname":"Zeus","friends":[]}
            ]);
            start();
          });
        }
      });
      stop();
    });


    asyncTest("Delete authorized", 2, function(){
      $.ajax({
        url: '/people/1',
        type: 'POST',
        data: JSON.stringify({method_: 'DELETE'}),
        success: function(){
          ok(true, 'Delete accepted');
          $.ajax({
            url:'/people/1', 
            error: function(){
              ok(true, "Can't get deleted object");
              start();
            }
          });
        }
      });
      stop();
    });


    asyncTest("Delete non authorized", 2, function(){
      $.ajax({
        url: '/people/3',
        type: 'POST',
        data: JSON.stringify({method_: 'DELETE'}),
        error: function(){
          ok(true, 'Delete refused');
          $.getJSON('/people/3', function(data){
            ok(true, "Object still available");
            start();
          });
        }
      });
      stop();
    });


    asyncTest("Multiple deletes - authorized", 1, function(){
      $.ajax({
        url: '/people/1,2',
        type: 'POST',
        data: JSON.stringify({method_: 'DELETE'}),
        success: function(){
          $.getJSON('/people/',function(data){
            same(data, {
              "items":[{"id":3,"firstname":"Zeus","friends":[]}],
              "from":1, "to":1,"total":1
            });
            start();
          });
        }
      });
      stop();
    });

    asyncTest("Multiple deletes - non authorized", 1, function(){
      $.ajax({
        url: '/people/1,3',
        type: 'POST',
        data: JSON.stringify({method_: 'DELETE'}),
        error: function(){
          $.getJSON('/people/',function(data){
            same(data, {
              "items":[
                {"id":1,"firstname":"Calypso","friends":[ {id:1}, {id:2}, {id:3}]},
                {"id":2,"firstname":"P","friends":[{id:1}]},
                {"id":3,"firstname":"Zeus","friends":[]}
              ],
              "from":1, "to":3,"total":3
            });
            start();
          });
        }
      });
      stop();
    });


    asyncTest("Errors (POST)", 1, function(){
      $.ajax({
        url: '/people/2?error_=1',
        type: 'POST',
        data: JSON.stringify({method_: 'DELETE'}),
        error: function(){
          ok(true, 'Error on post delete raised');
          start();
        }
      });
      stop();
    });

    asyncTest("Errors (GET)", 1, function(){
      $.ajax({
        url: '/people/3?error_=1', 
        error:function(data){
          ok(true, "Error on get raised");
          start();
        }
      });
      stop();
    });


  });
})();

