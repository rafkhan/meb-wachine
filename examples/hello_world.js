var Meb = require('../meb');
var MebApp = Meb.App;

var app = new MebApp();
app.resource({
  path: '/',
  allowedMethods: [Meb.methods.GET], // not required, GET is enabled by default
  handleOk: function() {
    return { hello: 'world' };
  } 
});

var server = app.getServer();
console.log('Starting web server on localhost:3333');
server.listen(3333);
