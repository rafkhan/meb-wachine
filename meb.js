var _        = require('lodash');
var http     = require('http');
var director = require('director');
var httpStatusToDescription = require('http-status-to-description');

var httpMethods = require('./lib/methods');
var decisions = require('./lib/decisions');

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
//     i.e: [oldmeb.methods.GET, 'POST', ...]
//
// - authorized:
//   - Function
//   - Predicate that determines whether a request is authorized
//     to access a specific resource
//
// - forbidden (fn predicate)
// - uriTooLarge (url too large) (fn predicate)
// - exists (fn predicate)
// - existedPreviously (fn predicate)
// - permitPostToMissingResource (bool, default true)
//


var defaultWM = {
  knownMethods: _.values(httpMethods),
  allowedMethods: [httpMethods.GET],

  uriTooLarge: function(req) {
    if(req.url.length > 4096) {
      return true;
    }
    return false;
  },

  authorized: function() { return true; },
  forbidden: function() { return false; },
  tooLarge: function() { return false; }, //FIXME
  exists: function() { return true; },
  existedPreviously: function() { return false; },
  permitPostToMissingResource: true
};

var mebApp = function() {
  var $meb = this;
  $meb.routeMap = {};

  //
  // TODO: 400 - Malformed?
  // 501 (not impl) Unknown or unsupported header
  // 415 Unsupported media type
  // 413 Request Entity Too Large
  //

  function writeErr(res, code) {
    var msg = httpStatusToDescription(code);
    res.writeHead(code);
    res.write(msg);
    res.end();
  }

  function runWebMachine(machine) {
    return function() {

      var req = this.req,
          res = this.res;

      // Known Method?
      if(decisions.unknownMethod(machine.knownMethods, req)) {
        writeErr(res, 501);
        return;
      }

      // URI too long?
      if(machine.uriTooLarge(req)) {
        writeErr(res, 414); // 414 - Request URI too long
        return;
      }

      // Method Allowed?
      if(!decisions.methodAllowed(machine.allowedMethods, req)) {
        writeErr(res, 405); // 405 - Method Not Allowed
        return;
      }

      // Authorized?
      if(!machine.authorized(req)) {
        writeErr(res, 401); // 401 - Unauthorized
        return;
      }

      // Forbidden?
      if(machine.forbidden(req)) {
        writeErr(res, 403); // 403 - Forbidden
        return;
      }

      // OPTIONS?
      // DEFAULTS TO handleOK
      if(req.method === httpMethods.OPTIONS) {
        if(machine.options) {
          machine.options(req, res);
          return;
        } else {
          machine.handleOk(req, res);
          return;
        }
      }


      //*********************************
      // Accept-* handling should go here
      //*********************************
      
      // Reource exists?
      if(!machine.exists(req)) {
        //TODO if match exists -> 412

        if(req.method === httpMethods.PUT) {
          //TODO this
        } else {
          if(machine.existedPreviously(req)) {
            //TODO existed prev
          } else {
            if(req.method === httpMethods.POST) {
              if(machine.permitPostToMissingResource){
                //TODO this
              }
            }
          }
        }

        res.writeErr(404);
        return;
      }


      if(req.method === httpMethods.GET) {
        machine.handleOk(req, res);
        return;
      }
    };
  }

  // returns `this`
  $meb.resource = function(machine) {
    // Add current webmachine to available routes
    
    // Copy webmachine, adding default values when necessary
    var keys = Object.keys(defaultWM);
    keys.forEach(function(k) {
      if(defaultWM.hasOwnProperty(k)) {
        if(!machine.hasOwnProperty(k)) {
          machine[k] = defaultWM[k];
        }
      }
    });

    $meb.routeMap[machine.path] = {
      // Attach to all HTTP methods
      // FIXME: include the rest of the methods
      //        (except HEAD, look at Router.prototype.dispatch for rationale)
      get: runWebMachine(machine),
      patch: runWebMachine(machine),
      post: runWebMachine(machine),
      put: runWebMachine(machine),
      delete: runWebMachine(machine)
    };

    return $meb;
  };

  $meb.getServer = function() {
    var router = new director.http.Router($meb.routeMap);

    return http.createServer(function (req, res) {
      router.dispatch(req, res, function(err) {
        res.writeHead(err.status || 500);
        res.write(JSON.stringify(err));
        res.end();
      });
    });
  };

};

mebApp.methods = httpMethods;

exports = module.exports = mebApp;

