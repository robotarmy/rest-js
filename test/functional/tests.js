/* Rest.js functionnal tests.
 * 
 * These tests rely on the server behaviour.
 * To run the server: 
 *    node test/functionnal/server.js
 * To run the tests, run the server, and open the 
 * following url with the browser being used to test:
 *    http://127.0.0.1:8000/tests
 */
(function(){

  var reinit_data = function(){
    console.log("setUp!");
    R.clear_caches();
    // Reinit data on server side:
    $.ajax({
      url: '/tests/reinit_data',
      type: 'GET',
			cache: false,
      async: false,
    });
  };

  var lifecycle = {
    setup: reinit_data,
  };


  $(document).ready(function(){

    //-----------------------------------------------
    module("Index", lifecycle);

    var persons_test = [
      {"id":1,"firstname":"Calypso","friends":[{"id":1},{"id":2},{"id":3}]},
      {"id":2,"firstname":"P","friends":[{"id":1}]},
      {"id":3,"firstname":"Zeus","friends":[]}
    ];


    asyncTest("Index with no option", 5, function(){
      R.Person.index(function(data){
        equals(data.items.length, 3);
        equals(data.total, 3);
        equals(data.from, 1);
        equals(data.to, 3);
        same($.map(data.items, function(obj){return obj.id}),
             [1,2,3])
        start();
      });
      stop();
    });

    asyncTest("Index with offset 0 and limit 3", 5, function(){
      R.Person.index({offset: 0, limit:3}, function(data){
        equals(data.items.length, 3);
        equals(data.total, 3);
        equals(data.from, 1);
        equals(data.to, 3);
        same($.map(data.items, function(obj){return obj.id}),
             [1,2,3])
        start();
      });
      stop();
    });

    asyncTest("Index with limit 10", 5, function(){
      R.Person.index({limit: 10}, function(data){
        equals(data.items.length, 3);
        equals(data.total, 3);
        equals(data.from, 1);
        equals(data.to, 3);
        same($.map(data.items, function(obj){return obj.id}),
             [1,2,3])
        start();
      });
      stop();
    });

    asyncTest("Index with offset 1 and limit 2", 6, function(){
      R.Person.index({offset: 1, limit:2}, function(data){
        equals(data.from, 2);
        equals(data.to, 3);
        equals(data.total, 3);
        equals(data.items.length, 2);
        equals(data.items[0].friends[0].id, 1);
        equals(data.items[1].friends.length, 0);
        start();
      });
      stop();
    });

    asyncTest("Index with offset 2", 5, function(){
      R.Person.index({offset: 2}, function(data){
        equals(data.from, 3);
        equals(data.to, 3);
        equals(data.total, 3);
        equals(data.items.length, 1);
        equals(data.items[0].id, 3);
        start();
      });
      stop();
    });

    asyncTest("Index with error", 1, function(){
      R.Person.index({error_:1}, function(data){
        equals(data, null, "data is null");
        start();
      });
      stop();
    });

    asyncTest("Sequential indexes - no option", 3, function(){
      var save = $.ajax;
      R.Person.index(function(data){
        $.ajax = function(){
          ok(false, 'There should only be one call to ajax!');
        };
        R.Person.index(function(data2){
          ok(data === data2);
          equals(data.total, 3);
          equals(data.items.length, 3);
          $.ajax = save;
          start();
        });
      });
      stop();
    });

    asyncTest("Sequential indexes - same options", 3, function(){
      var save = $.ajax;
      R.Person.index({offset:1, limit:1}, function(data){
        $.ajax = function(){
          ok(false, 'There should only be one call to ajax!');
        };
        R.Person.index({offset:1, limit:1}, function(data2){
          ok(data === data2);
          equals(data.total, 3);
          equals(data.items.length, 1);
          $.ajax = save;
          start();
        });
      });
      stop();
    });

    asyncTest("Sequential indexes - different options", 5, function(){
      R.Person.index({offset:1}, function(data){
        equals(data.items.length, 2);
        equals(data.items[0].id, 2);
        R.Person.index({limit:2}, function(data2){
          ok(data !== data2);
          equals(data2.items.length, 2);
          equals(data2.items[0].id, 1);
          start();
        });
      });
      stop();
    });

    asyncTest("Force refresh on index", 4, function(){
      R.Person.index(function(data){
        equals(data.items.length, 3);
        R.Person.index(function(data2){
          equals(data, data2);
          R.Person.index(1, {}, function(data3){
            ok(data != data3);
            equals(data.items.length, 3);
            start();
          });
        })
      });
      stop();
    });

    //-----------------------------------------------
    module('Get', lifecycle);

    asyncTest("Get one existing resource", 5, function(){
      var p = R.Person.get(1, function(obj){
        equals(obj.firstname, 'Calypso');
        equals(obj.id, 1);
        ok(obj === obj.friends[0], "Cyclic reference");
        equals(obj.friends[1].id, 2);
        equals(obj.friends[1].firstname, undefined, "No eager loading");
        start();
      });
      stop();
    });

    asyncTest("Get one non existing resource", 1, function(){
      R.Person.get(666, function(obj){
        equals(obj, null, "Callback called with null");
        start();
      });
      stop();
    });

    asyncTest("Get on an already partially loaded object", 5, function(){
      R.Person.get(1, function(p1){
        var p2 = p1.friends[1]; // object partially loaded
        equals(p2.firstname, undefined);
        ok(p2._pl, 'Partially loaded');
        R.Person.get(2, function(p22){
          equals(p2, p22);
          equals(p2.firstname, 'P');
          ok(!p2._pl, 'Fully loaded!');
          start();
        });
      });
      stop();
    });
  
    asyncTest("Get multiples resources - no error", 4, function(){
      R.Person.get([1,2], function(objs){
        console.log(objs[0].Class.schema.id, 'Person');
        equals(objs[0].Class.schema.id, 'Person');
        equals(objs[1].Class.schema.id, 'Person');
        equals(objs[0].firstname, 'Calypso');
        equals(objs[1].firstname, 'P');
        start();
      }); 
      stop();
    });

    asyncTest("Get multiples resources - error", 1, function(){
      R.Person.get([1,2,3,66], function(objs){
        equals(objs, null, "All or nothing");
        start();
      });
      stop();
    });

    asyncTest("Sequential gets", 3, function(){
      // must result in only one request to the server
      // callbacks must be called in the right order
      var order = 1;
      R.Person.get(1, function(){
        ok(order == 1, "call 1");
        order++;
      });
      R.Person.get(1, function(){
        ok(order == 2, "call 2");
        order++;
      });
      R.Person.get(1, function(){
        ok(order == 3, "call 3");
        order++;
        start();
      });
      stop();
    });

    asyncTest("Callback called before return if data in cache", 1, function(){
      var p = new R.Person({id:5});
      var callback_called = false;
      R.Person.get(5, function(obj){
        callback_called = true;
        start();
      });
      ok(callback_called, "Obj loaded: callback called before return");
      stop();
    });

    asyncTest("GET on one resource (not previously loaded) with force refresh", 3, function(){
      R.Person.get(1, true, function(obj){
        equals(obj.id, 1);
        equals(obj.firstname, 'Calypso');
        equals(obj.friends.length, 3);
        start();
      });
      stop();
    });

    asyncTest("GET on one resource (already loaded) with force refresh", 3, function(){
      new R.Person({id:1});
      R.Person.get(1, true, function(obj){
        equals(obj.id, 1);
        equals(obj.firstname, 'Calypso');
        equals(obj.friends.length, 3);
        start();
      });
      stop();
    });

    asyncTest("Get multiples resources (not loaded) with force refresh", 4, function(){
      R.Person.get([1,2], true, function(objs){
        console.log(objs[0].Class.schema.id, 'Person');
        equals(objs[0].Class.schema.id, 'Person');
        equals(objs[1].Class.schema.id, 'Person');
        equals(objs[0].firstname, 'Calypso');
        equals(objs[1].firstname, 'P');
        start();
      }); 
      stop();
    });

    asyncTest("Get multiples resources (loaded) with force refresh", 4, function(){
      new R.Person({id:1});
      new R.Person({id:2});
      R.Person.get([1,2], true, function(objs){
        console.log(objs[0].Class.schema.id, 'Person');
        equals(objs[0].Class.schema.id, 'Person');
        equals(objs[1].Class.schema.id, 'Person');
        equals(objs[0].firstname, 'Calypso');
        equals(objs[1].firstname, 'P');
        start();
      }); 
      stop();
    });

    asyncTest("Refresh on one existing resource using get + force refresh", 2, function(){
      R.Person.get(2, function(p){
        equals(p.firstname, 'P');
        p.firstname = 'Fantomas';
        R.Person.get(2, true, function(obj){
          equals(obj.firstname, 'P');
          start();
        });
      });
      stop();
    });

    asyncTest("Refresh on one existing resource usising refresh", 2, function(){
      R.Person.get(2, function(p){
        equals(p.firstname, 'P');
        p.firstname = 'Fantomas';
        p.refresh(function(){
          equals(p.firstname, "P");
          start();
        });
      });
      stop();
    });


    //-----------------------------------------------
    module('unlink', lifecycle);

    asyncTest("Unlink", 1, function(){
      R.Person.get(1, function(obj){
        same(obj.unlink(), {
          "id":1,
          "firstname":"Calypso",
          "friends":[{"id":1},{"id":2},{"id":3}],
          "mother": null,
        });
        start();
      });
      stop();
    });


    //-----------------------------------------------
    module('new', lifecycle);

    asyncTest("Create a new complete object and save it", 5, function(){
      var p = new R.Person({
        firstname: 'Guido',
        friends: [],
        mother: null,
      });
      equals(p.firstname, 'Guido');
      same(p.friends, []);
      equals(p.mother, null);
      p.save(function(){
        ok(p.id != undefined, 'id is defined');
        ok(p.id != null, 'id is not null');
        start(); 
      });
      stop();
    });

    asyncTest("Create a new object, with empty values", 3, function(){
      var p = new R.Person({firstname: 'Pierre'});
      // That shouldn't be a problem if the server accepts it:
      p.save(function(err){
        ok(err == null, 'no error');
        ok(p.id != undefined, 'id is defined');
        ok(p.id != null, 'id is not null');
        start();
      });
      stop();
    });

    asyncTest("Create a new object, with missing or bad values", 2, function(){
      var p = new R.Person({
        mother: {id: 9999},
      });
      // The server should not accept it:
      p.save(function(err){
        equals(p.id, undefined);
        same(err, {
          status: 403,
          statusText: "Forbidden",
        });
        start();
      });
      stop();
    });

    asyncTest("Create a new complete object with references and save it", 6, function(){
      R.Person.get([1,2], function(persons){
        var p = new R.Person({
          firstname: 'Guido',
          // When specified from scratch, must give references like that:
          friends: [{id: 1}, {id: 2}],
          mother: null,
        });
        ok(p.friends[0] === persons[0]);
        ok(p.friends[1] === persons[1]);
        p.save(function(){
          ok(p.id != undefined, 'id is defined');
          ok(p.id != null, 'id is not null');
          ok(p.friends[0] === persons[0]);
          ok(p.friends[1] === persons[1]);
          start();
        });
      });
      stop();
    });

    asyncTest("Change references from existing object and save it", 4, function(){
      R.Person.get(1, function(obj){
        obj._update({
          mother: {id: 3},
          friends: [{id: 1}],
        });
        obj.save(function(err){
          equals(err, null);
          equals(obj.friends.length, 1);
          equals(obj.friends[0].firstname, 'Calypso');
          equals(obj.mother.id, 3);
          start();
        });
      });
      stop();
    });

    //-----------------------------------------------
    
    module('update', lifecycle);

    asyncTest("Update one object", 3, function(){
      R.Person.get(2, function(p){
        p.update({firstname: 'Pierre'}, function(err){
          equals(err, null, 'no error');
          equals(p.firstname, 'Pierre');
          R.Person.clear_cache();
          R.Person.get(2, function(obj){
            equals(obj.firstname, 'Pierre');
            start();
          });
        });
      });
      stop();
    });

    asyncTest("Update one object - error", 2, function(){
      R.Person.get(3, function(p){
        p.update({firstname: 'Ulysse'}, function(err){
          equals(err.status, 403);
          equals(p.firstname, 'Zeus');
          start();
        });
      });
      stop();
    });

    asyncTest("Update more than one object in once", 5, function(){
      R.Person.update([1, 2], {firstname: "Same"}, function(err){
        equals(err, null, 'no error');
        R.Person.get([1, 2], true, function(data){
          equals(data[0].id, 1);
          equals(data[1].id, 2);
          equals(data[0].firstname, "Same");
          equals(data[1].firstname, "Same");
          start();
        });
      });
      stop();
    });

    asyncTest("Update more than one object in once - error", 7, function(){
      R.Person.update([1, 2, 3], {firstname: "Same"}, function(err){
        equals(err.status, 403);
        R.Person.get([1, 2, 3], true, function(data){
          equals(data[0].id, 1);
          equals(data[1].id, 2);
          equals(data[2].id, 3);
          equals(data[0].firstname, "Calypso");
          equals(data[1].firstname, "P");
          equals(data[2].firstname, "Zeus");
          start();
        });
      });
      stop();
    });

    //-----------------------------------------------
    module('delete', lifecycle);

    asyncTest("Delete one object - no error", 2, function(){
      R.Person.get(1, function(p1){
        p1.delete_(function(err){
          equals(err, null, "No error");
          R.Person.get(1, function(obj){
            equals(obj, null, "Object no more available");
            start();
          });
        });
      });
      stop();
    });

    asyncTest("Delete one object - error 403", 2, function(){
      // The object exist, but can not be deleted:
      R.Person.get(3, function(obj){
        ok(obj != null, "object to delete exist");
        obj.delete_(function(err, data){
          same(err, {status: 403, statusText: "Forbidden"});
          start();
        });
      });
      stop();
    });

    asyncTest("Delete one object - error 404", 1, function(){
      // The object does not exist:
      R.Person.delete_(666, function(err){
        same(err, {status: 404, statusText: "Not Found"});
        start();
      })
      stop();
    });

    asyncTest("Delete more than one object - no error", 3, function(){
      R.Person.delete_([1,2], function(error){
        equals(error, null);
        R.Person.get(1, function(obj){
          equals(obj, null);
          R.Person.get(2, function(obj){
            equals(obj, null);
            start();
          });
        });
      });
      stop();
    });

    asyncTest("Delete more than one object - error", 4, function(){
      // Person 3 can not be deleted:
      R.Person.delete_([1,3], function(err){
        ok(err, 'error');
        R.Person.get([1,3], function(objs){
          equals(objs.length, 2);
          equals(objs[0].id, 1);
          equals(objs[1].id, 3);
          start();
        });
      });
      stop();
    });

  });
})();

