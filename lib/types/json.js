'use strict';

var json = {
  mime: 'application/json',
  encode: function(body) {
    return JSON.parse(body);
  },

  decode: function(data) {
    return JSON.stringify(data);
  }
};

exports = module.exports = json;

