'use strict';

var Meb = require('../meb');
var MebApp = Meb.App;
var assert = require('assert');
var supertest = require('supertest');

function pingResource() {
  return {
    path: '/ping',
    handleOk: function(state, req) {
      return { message: 'pong' };
    }
  };
}

describe('Context handling', function() {
  it('Should store result of handler in context', function(done) {
    var resource = {
      path: '/ping',
      handleOk: function(ctx, params, req) {
        return ctx.toJS();
      },
    
      exists : function(ctx, params, req) {
        return ctx.set('x', 42);
      }
    };

    
    var app = new MebApp();
    app.resource(resource);
    var server = app.getServer();
    var st = supertest(server);

    st.get('/ping')
      .expect(200)
      .end(function(err, res) {
        if(err) { throw err };
        assert.equal(42, JSON.parse(res.text).x);
        done();
      });
  });
});


