/**
 * Welcome to the MebWachine documentation!<br />
 * Note that I will often make reference to coordinates on
 * <b>
 * [this diagram]{@link https://raw.githubusercontent.com/rafkhan/meb-wachine/master/diagram.png}.
 * </b>
 *
 * @namespace Meb
 */

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
    //var msg = httpStatusToDescription(code);
    res.writeHead(code);
    //res.write(msg);
    res.end();
  }

  // Diagram O-18
  // Checks if an entity has multiple representations, sends 303 if so.
  // If not, it runs handleOk.
  function writeWithMultipleRepCheck(req, res, machine) {
    if(machine.hasMultipleRepresentations(req)) {
      writeErr(res, 300); // 300 - Multiple Choices
      return;
    } else {
      machine.handleOk(req, res); // 200 - Ok
      return;
    }
  }

  // Diagram O-20
  // This checks if the response includes an entity with potentially
  // multiple representations. This will write and close the result stream.
  function writeResponseWithEntityCheck(req, res, machine) {
    if(machine.respondWithEntity) {
      writeWithMultipleRepCheck(req, res, machine);
      return;
    } else {
      writeErr(res, 204); // 204 - No Content
      return;
    } 
  }

  // Diagram P-11
  function writeWithNewResourceCheck(req, res, machine) {
    if(machine.newResource(req)) {
      //TODO check response value should be for 201
      writeErr(res, 201); // 201 - Created
      return;
    } else {
      writeResponseWithEntityCheck(req, res, machine);
      return;
    }
  }

  function getWebMachineResponse(machine) {

    var resp = runWebMachine(machine);
  }

  /*
    * THE RETURN VALUESHOULD BE IN THE FOLLOWING FORMAT
    * {
    *   code: 200,
    *   data:   {}, // empty resp body if excluded
    * }
    */
  function runWebMachine(machine) {
    return function() {

      var req = this.req,
          res = this.res;

      // Known Method?
      if(decisions.unknownMethod(machine.knownMethods, req)) {
        return { code: 501 };
      }

      // URI too long?
      if(machine.uriTooLarge(req)) {
        return { code: 414 }; // 414 - Request URI too long
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
      // Diagram G-7
      if(!machine.exists(req)) {
        //TODO if match exists -> 412 (Diagram H-7)

        // Diagram i-7
        if(req.method === httpMethods.PUT) {
          //TODO this
          if(machine.applyToDifferentUri(req)) {
            writeErr(res, 301); // 301 - Moved Permanently
            return;
          }

          // COULD POSSIBLY REFACTOR THIS
          if(machine.conflict(req)) {
            writeErr(res, 409); // 409 - Conflict
            return;
          }

          writeWithNewResourceCheck(req, res, machine);
          return;

        } else {
          // Diagram K-7
          if(machine.existedPreviously(req)) {
            // Diagram K-5
            if(machine.movedPermanently(req)) {
              writeErr(res, 301); // 301 - Moved Permanently
              return;
            }

            if(machine.movedTemporarily(req)) {
              writeErr(res, 307); // 307 - Moved Temporarily
              return;
            } else {
              if(req.method === httpMethods.POST) {
                // Diagram N-5
                if(machine.permitPostToMissingResource) {
                  if(machine.redirect(req)) {
                    writeErr(res, 303); // 303 - See Other
                  } else {
                    writeWithNewResourceCheck(req, res, machine);
                    return;
                  }
                } else {
                  writeErr(res, 410); // 410 - Gone
                  return;
                }
              } else {
                writeErr(res, 410); // 410 - Gone
                return;
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

        writeErr(res, 404);
        return;
      }

      //****************************************
      // TODO
      // Caching, ETags, mofified since, etc, :(
      //****************************************
      
      // Diagram M-16
      // TIME TO DELETE STUFF >:D
      if(req.method === httpMethods.DELETE) {
        // machine's delete function,
        var deleteFn = machine.onDelete;
        // Diagram M-20
        if(!deleteFn) {
          // No deleteFn therefore no delete enacted
          writeErr(res, 202); // 202 - Accepted
          return;
        }

        if(deleteFn(req)) {
          writeResponseWithEntityCheck(req, res, machine);
          return;
        } else { // delete not enacted
          writeErr(res, 202); // 202 - Accepted
          return;
        }
      }

      // Diagram N-16
      if(req.method === httpMethods.POST) {
        if(machine.redirect(req)) {
          writeErr(res, 303); // 303 - See Other
          return;
        } else {
          writeWithNewResourceCheck(req, res, machine);
          return;
        }
      }

      // Diagram O-16
      // TODO write tests
      if(req.method === httpMethods.PUT) {
        // Diagram O-14
        if(machine.conflict(req)) {
          writeErr(res, 409); // 409 - Conflict
          return;
        }

        writeWithNewResourceCheck(req, res, machine);
        return;
      } else {
        writeWithMultipleRepCheck(req, res, machine);
        return;
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

