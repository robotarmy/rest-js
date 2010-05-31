
(function(){

  var test_success_error = function(success, code){
    var types = ['GET', 'POST'];
    for(var i=0; i<2; i++){
      asyncTest(types[i] + " " +code, 1, function(){
        $.ajax({
          url: '/?code='+code,
          type: types[i],
          cache: false,
          success: function(){
            ok(success, "Called success.")
            start();
          },
          error: function(){
            ok(!success, 'Called error');
            start();
          }
        });
        stop();
      });
    }
  };

  $(document).ready(function(){

    module("test ajax");

    // Success:
    for(var code=200; code<207; code++) test_success_error(true, code);
    
    // Redirection:
    for(var code=300; code<308; code++) test_success_error(false, code);

    // Client error:
    for(var code=400; code<418; code++) test_success_error(false, code);

    // Internal server error:
    for(var code=500; code<510; code++) test_success_error(false, code);

  });
})();

