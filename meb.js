/** @namespace Meb */

var _        = require('lodash');
var http     = require('http');
var director = require('director');
var httpStatusToDescription = require('http-status-to-description');

var httpMethods = require('./lib/methods');
var decisions = require('./lib/decisions');
var defaultWM = require('./lib/defaultWM');

/**
 * You can define resources on an instantiated MebApp
 *
 * @class MebApp
 * @memberof Meb
 */
var MebApp = function() {
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
      // TODO
      // Accept-* handling should go here
      //*********************************
      
      // Reource exists?
      if(!machine.exists(req)) {
        //TODO if match exists -> 412

        if(req.method === httpMethods.PUT) {
          //TODO this
        } else {
          if(machine.existedPreviously(req)) {
            if(machine.movedPermanently(req)) { // TODO doc
              writeErr(res, 301); // 301 - Moved Permanently
            } else {
              if(machine.movedTemporarily(req)) { // TODO doc
                writeErr(res, 307); // 307 - Moved Temporarily
              } else {
                if(req.method === Meb.methods.POST) {
                  if(machine.permitPostToMissingResource){ // TODO doc
                    //TODO this **
                  } else {
                    writeErr(res, 410); // 410 - Gone
                  }
                } else {
                  writeErr(res, 410); // 410 - Gone
                }
              }
            }
          } else {
            if(req.method === httpMethods.POST) {
              if(machine.permitPostToMissingResource){ // TODO doc
                //TODO this **
              } // else 404
            } // else 404
          }
        }

        res.writeErr(404);
        return;
      }

      //****************************************
      // TODO
      // Caching, ETags, mofified since, etc, :(
      //****************************************
      
      // TIME TO DELETE STUFF >:D
      if(req.method === httpMethods.DELETE) {
        //machines delete function,
        var deleteFn = machine.onDelete;
        if(!deleteFn) {
          //No deleteFn therefore no delete enacted
          writeErr(res, 202); // 202 - Accepted
          return;
        }

        if(deleteFn(req)) {
          if(machine.respondWithEntity) {
            machine.handleOk(req, res);
            return;
          }
        } else {
          writeErr(res, 202); // 202 - Accepted
          return;
        }

      }


      if(req.method === httpMethods.GET) {
        machine.handleOk(req, res);
        return;
      }
    };
  }

  /**
   * Define a resource on the MebApp.
   *
   * @function resource
   * @memberof Meb.MebApp
   * @param  {Object}  machine  WebMachine options.
   * @returns Itself (current MebApp instance)
   */
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

  /**
   * Create HTTP server that routes to all created
   * webmachine resources. Ideally this crap should become
   * connect/koa middleware. <b>APIS ARE CHANGING!</b>
   *
   * @function getServer
   * @memberof Meb.MebApp
   * @returns Node HTTP server
   */
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

exports = module.exports = {
  /**
   * Constructor for MebApp.
   *
   * @var App
   * @see {@link Meb.MebApp}
   * @memberof Meb
   */
  App: MebApp,

  /**
   * The default webmachine.
   *
   * @name Meb.defaultWM
   * @see {@link module:defaultWM} The contains the properties of this objects
   */
  defaultWM: defaultWM,

  /**
   * HTTP method names.
   *
   * @name Meb.methods
   * @memberof Meb
   */
  methods: httpMethods
};

