'use strict';

var methods = require('./methods') ;
var _        = require('lodash');

exports = module.exports = {
  unknownMethod: function(knownMethods, req) {
    if(_.contains(knownMethods, req.method)) {
      return false;
    }
    return true;
  },

  methodAllowed: function(allowedMethods, req) {
    if(_.contains(allowedMethods, req.method)) {
      return true;
    }

    return false;
  },

  acceptExists: function(req) {
    var accept = req.getHeader('Accept');
    if(accept) {
      return accept;
    }

    return false;
  }
};

