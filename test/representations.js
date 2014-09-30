'use strict';

var Meb = require('../meb');
var Meb = require('../lib/decisions');
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

describe('Accept', function() {
  it('Should recognize and parse Accept header in decisions', function(done) {
    
  });
});
