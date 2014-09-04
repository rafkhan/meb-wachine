var Meb = require('../meb');
var assert = require('assert');
var supertest = require('supertest');


/*
meb.resource({
  path: '/asd/:x',
  allowedMethods: [meb.methods.GET, meb.methods.POST],

  isAuthorized: function(req) {
    return true;
  },

  isForbidden: function(req) {
    return false;
  },

  options: function(req, res) {
    res.write('nice options call bro');
    res.end();
  },

  exists: function(req) {
    if(db.hasValue(req.params.x)) {
      var y = db.get(x);
      return {y: y};
    }

    return false;
  },

  handleOk: function(req, res) {
    res.write('asd');
    res.end();
  }
});
*/

//var server = meb.createServer();
//server.listen('3800');
describe('Meb Resource', function() {
  it('Should ping/pong', function() {
    var app = new Meb();
    app.resource({
      path: '/ping',
      handleOk: function(req, res) {
        res.write("pong");
        res.end();
      }
    });
    
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

