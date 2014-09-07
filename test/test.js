var Meb = require('../meb');
var MebApp = Meb.App;
var assert = require('assert');
var supertest = require('supertest');


function tErr(err) {
  if(err) throw err;
}

function pingResource() {
  return {
    path: '/ping',
    handleOk: function(req, res) {
      res.write("pong");
      res.end();
    }
  };
}

describe('Meb Resource', function() {
  it('Should ping/pong', function() {
    var app = new MebApp();
    app.resource(pingResource());
    
    var server = app.getServer();
    supertest(server)
      .get('/ping')
      .expect(200)
      .end(function(err, res) {
        if(err) throw err;
        assert.equal("pong", res.text);
      });
  });
});

describe('Method Handling', function() {

  it('Should disallow everything but GET by default', function() {
    var app = new MebApp();
    app.resource(pingResource());
    
    var server = app.getServer();
    var st = supertest(server);
    st.post('/ping')
      .expect(405)
      .end(tErr);

    st.get('/ping')
      .expect(200)
      .end(tErr);
  });

  it('Should allow method specification, deny the others', function() {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.POST, Meb.methods.DELETE];

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.post('/ping')
      .expect(200)
      .end(tErr);

    st.delete('/ping')
      .expect(202)
      .end(tErr);

    st.get('/ping')
      .expect(405)
      .end(tErr);
  });
});

describe('DELETE stuff', function() {
  it('Should return "Accepted" without handler', function() {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.DELETE];

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.delete('/ping')
      .expect(202)
      .end(tErr);

  });

  it('Should handle onDelete that does not enact', function() {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.DELETE];
    resource.onDelete = function(req) { return false; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.delete('/ping')
      .expect(202)
      .end(tErr);
  });

  it('Should handle onDelete that respondes with entity', function() {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.DELETE];
    resource.onDelete = function(req) { return true; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.delete('/ping')
      .expect(200)
      .end(function(err, res) {
        if(err) throw err;
        assert.equal("pong", res.text);
      });
  });
});

