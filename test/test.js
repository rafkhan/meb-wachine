'use strict';

var Meb = require('../meb');
var MebApp = Meb.App;
var assert = require('assert');
var supertest = require('supertest');

// Non-responsive requests usually don't error out. This makes them.
// Takes an optional `done` parameter that it will use to throw
// potential errors. If you want to use multiple callbacks with this
// function, leave out `done` in the tErr call, and call it yourself
// in a catch block.
function tErr(done) {
  if(done) {
    return function(err, res) {
      done(err);
    };
  }

  return function(err) {
    if(err) { throw err; }
  };
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
  it('Should ping/pong', function(done) {
    var app = new MebApp();
    app.resource(pingResource());
    
    var server = app.getServer();
    supertest(server)
      .get('/ping')
      .expect(200)
      .end(function(err, res) {
        if(err) { done(err); }
        assert.equal("pong", res.text);
        done();
      });
  });
});

describe('Default responses', function() {

  function makeAppWithMethod(method) {
    var app = new MebApp();
    var resource = pingResource();
    resource.allowedMethods = [method];
    app.resource(resource);
    
    return app.getServer(); 
  }

  it('Should 200 on GET by default', function(done) {
    supertest(makeAppWithMethod(Meb.methods.GET))
      .get('/ping')
      .expect(200)
      .end(function(err, res) {
        if(err) throw err;
        assert.equal("pong", res.text);
        done();
      }); 
  });

  it('Should 200 on POST by default', function(done) {
    supertest(makeAppWithMethod(Meb.methods.POST))
      .post('/ping')
      .expect(200)
      .end(function(err, res) {
        if(err) throw err;
        assert.equal("pong", res.text);
        done();
      }); 
  });

  it('Should 200 on PUT by default', function(done) {
    supertest(makeAppWithMethod(Meb.methods.PUT))
      .put('/ping')
      .expect(200)
      .end(function(err, res) {
        if(err) throw err;
        assert.equal("pong", res.text);
        done();
      }); 
  });

  it('Should 202 on DELETE by default', function(done) {
    supertest(makeAppWithMethod(Meb.methods.DELETE))
      .delete('/ping')
      .expect(202)
      .end(tErr(done)); 
  });
});


describe('Method Handling', function() {

  it('Should disallow everything but GET by default', function(done) {
    var app = new MebApp();
    app.resource(pingResource());
    
    var server = app.getServer();
    var st = supertest(server);
    try {
      st.post('/ping')
        .expect(405)
        .end(tErr());

      st.get('/ping')
        .expect(200)
        .end(tErr());
    } catch(err) {
      done(err);
      return;
    }

    done();
  });

  it('Should allow method specification, deny the others', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.POST, Meb.methods.DELETE];

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    try {
      st.post('/ping')
        .expect(200)
        .end(tErr());

      st.delete('/ping')
        .expect(202)
        .end(tErr());

      st.get('/ping')
        .expect(405)
        .end(tErr());
    } catch(err) {
      done(err);
      return;
    }

    done();
  });
});

describe('DELETE stuff', function() {
  it('Should return "Accepted" without handler', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.DELETE];

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.delete('/ping')
      .expect(202)
      .end(tErr(done));

  });

  it('Should handle onDelete that does not enact', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.DELETE];
    resource.onDelete = function(req) { return false; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.delete('/ping')
      .expect(202)
      .end(tErr(done));
  });

  it('Should handle onDelete that responds with entity', function(done) {
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
        assert.equal("pong", res.text);
        done(err);
      });
  });

  it('Should handle onDelete that does not respond with entity', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.DELETE];
    resource.onDelete = function(req) { return true; };
    resource.respondWithEntity = false;

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.delete('/ping')
      .expect(204)
      .end(tErr(done));
  });
});


describe('Redirection', function() {
  it('Should 303 on POST when redirect specified', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.POST];
    resource.redirect = function() { return true; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.post('/ping')
      .expect(303)
      .end(tErr(done)); 
  });
});

describe('New resource', function() {
  it('Should return 201 Created', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.POST];
    resource.newResource = function() { return true; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.post('/ping')
      .expect(201)
      .end(tErr(done)); 

  });
});

describe('Existence', function() {
  it('Should 404 when resource does not exist', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.GET];
    resource.exists = function() { return false; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.get('/ping')
      .expect(404)
      .end(tErr(done)); 
  });

  it('Should 301 when resource moved permanently', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.GET];
    resource.exists = function() { return false; };
    resource.existedPreviously = function() { return true; };
    resource.movedPermanently = function() { return true; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.get('/ping')
      .expect(301)
      .end(tErr(done)); 
  });

  it('Should 410 when not permitted to post to missing resource', function(done) {
    var resource = pingResource();
    resource.allowedMethods = [Meb.methods.POST];
    resource.permitPostToMissingResource = false;
    resource.exists = function() { return false; };
    resource.existedPreviously = function() { return true; };

    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.post('/ping')
      .expect(410)
      .end(tErr(done)); 
  });

});
