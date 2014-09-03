var meb = require('../meb');
var assert = require("assert");

meb.resource({
  path: '/asd/:x',
  allowedMethods: [meb.methods.GET],

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

  handleOk: function(req, res) {
    res.write('asd');
    res.end();
  }
});

//var server = meb.createServer();
//server.listen('3800');
describe('Meb', function() {
  it('Should be an object', function() {
    assert.equal('object', typeof(meb));
  });
});

