'use strict';

var Meb = require('../meb');
var MebApp = Meb.App;
var assert = require('assert');
var supertest = require('supertest');
var Q = require('q');

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

function dErr(deferred) {
  return function(err) {
    if(err) {
      deferred.reject(err);
    } else {
      deferred.resolve();
    }
  };
}

function pingResource() {
  return {
    path: '/ping',
    handleOk: function(state, req) {
      return { message: 'pong' };
    }
  };
}

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

