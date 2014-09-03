'use strict';

var _        = require('lodash');
var http     = require('http');
var director = require('director');

var meb = {};
var routeMap = {};

meb.methods = {
  GET: 'GET',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  PATCH: 'PATCH',
  POST: 'POST',
  PUT: 'PUT'
};

function getReqBodySize() {
  return 2048;
}

var decisions = {
  unknownMethod: function(machine, req) {
    var knownMethods = machine.knownMethods || _.values(meb.methods);
    if(_.contains(knownMethods, req.method)) {
      return false;
    }
    return true;
  },

  uriTooLong: function(machine, req) {
    if(req.url.length > 4096) {
      return true;
    }
    return false;
  },

  methodAllowed: function(machine, req) {
    var allowedMethods = machine.allowedMethods || [meb.methods.GET];
    if(_.contains(allowedMethods, req.method)) {
      return true;
    }

    return false;
  },

  authorized: function(machine, req) {
    var authFn = machine.isAuthorized;
    if(authFn) {
      return authFn();
    }

    return true;
  },

  forbidden: function(machine, req) {
    var forbidFn = machine.isForbidden;
    if(forbidFn) {
      return forbidFn();
    }

    return false;
  },

  tooLarge: function(machine, req) {
    var sizeFn = machine.isTooLarge;
    if(sizeFn) {
      return sizeFn();
    }
    
    return getReqBodySize() < 9000;
  }
};


function runWebMachine(machine) {
  return function() {
    console.log(arguments);

    var req = this.req,
        res = this.res;

    // Known Method?
    if(decisions.unknownMethod(machine, req)) {
      res.writeHead(501); // 501 - Not Implemented
      res.end();
      return;
    }

    // URI too long?
    if(decisions.uriTooLong(machine, req)) {
      res.writeHead(414); // 414 - Request URI too long
      res.end();
      return;
    }

    // Method Allowed?
    if(!decisions.methodAllowed(machine, req)) {
      res.writeHead(405); // 405 - Method Not Allowed
      res.end();
      return;
    }

    if(!decisions.authorized(machine, req)) {
      res.writeHead(401); // 401 - Unauthorized
      res.end();
      return;
    }

    if(decisions.forbidden(machine, req)) {
      res.writeHead(403); // 403 - Forbidden
      res.end();
      return;
    }

    if(req.method === meb.methods.OPTIONS) {
      if(machine.options) {
        machine.options(req, res);
      }
    }

    //
    // TODO: 400 - Malformed?
    // 501 (not impl) Unknown or unsupported header
    // 415 Unsupported media type
    // 413 Request Entity Too Large
    //

    if(req.method === meb.methods.GET) {
      machine.handleOk(req, res);
    }
  };
}


//
// Resource parameters
//
// - path:
//   - String
//   - Path to dispatch to from flatiron router.
//     i.e: "/users/:id/attr"
//
// - allowedMethods:
//   - Array
//   - List of HTTP methods allowed on a resource.
//     i.e: [meb.methods.GET, 'POST', ...]
//
// - isAuthorized:
//   - Function
//   - Predicate that determines whether a request is authorized
//     to access a specific resource
//
// - isForbidden
// - isTooLarge
//
meb.resource = function(machine) {
  // Add current webmachine to available routes
  routeMap[machine.path] = {
    // Attach to all HTTP methods
    // FIXME: include the rest of the methods
    //        (except HEAD, look at Router.prototype.dispatch for rationale)
    get: runWebMachine(machine),
    patch: runWebMachine(machine),
    post: runWebMachine(machine),
    put: runWebMachine(machine),
    delete: runWebMachine(machine)
  };
};

meb.createServer = function() {
  var router = new director.http.Router(routeMap);

  return http.createServer(function (req, res) {
    router.dispatch(req, res, function(err) {
      res.writeHead(err.status || 500);
      res.write(JSON.stringify(err));
      res.end();
    });
  });
};

exports = module.exports = meb;

