/**
 * Welcome to the MebWachine documentation!<br />
 * Note that I will often make reference to coordinates on
 * <b>
 * [this diagram]{@link https://raw.githubusercontent.com/rafkhan/meb-wachine/master/diagram.png}.
 * </b>
 *
 * @namespace Meb
 */

var _         = require('lodash');
var http      = require('http');
var director  = require('director');
var Immutable = require('immutable');
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


  // Diagram O-18
  // Checks if an entity has multiple representations, sends 303 if so.
  // If not, it runs handleOk.
  function writeWithMultipleRepCheck(machine, machineState, req, urlParams) {
    if(machine.hasMultipleRepresentations(req)) {
      return { code: 300 }; // 300 - Multiple Choices
    } else {
      return { code: 200,
        body: machine.handleOk(machineState, urlParams, req) }; // 200 - Ok;
    }
  }

  // Diagram O-20
  // This checks if the response includes an entity with potentially
  // multiple representations. This will write and close the result stream.
  function writeResponseWithEntityCheck(machine, machineState, req, urlParams) {
    if(machine.respondWithEntity) {
      return writeWithMultipleRepCheck(machine, machineState, req, urlParams);
    } else {
      return { code: 204 }; // 204 - No Content
    } 
  }

  // Diagram P-11
  function writeWithNewResourceCheck(machine, machineState, req, urlParams) {
    if(machine.newResource(req)) {
      //TODO check response value should be for 201
      return { code: 201 }; // 201 - Created
    } else {
      return writeResponseWithEntityCheck(machine, machineState, req, urlParams);
    }
  }

  /*
    * THE RETURN VALUESHOULD BE IN THE FOLLOWING FORMAT
    * {
    *   code: 200,
    *   data:   {}, // empty resp body if excluded
    * }
    */
  function runWebMachine(machine, req, urlParams) {

    var machineState = Immutable.Map(); // VERY IMPORTANT

    function checkVal(v) {
      if(v && typeof(v) === 'object') {
        machineState = v;
      }
    }

    // Known Method?
    if(decisions.unknownMethod(machine.knownMethods, req)) {
      return { code: 501 };
    }

    // URI too long?
    // TODO ctx switch?
    if(machine.uriTooLarge(req)) {
      return { code: 414 }; // 414 - Request URI too long
    }

    // Method Allowed?
    if(!decisions.methodAllowed(machine.allowedMethods, req)) {
      return { code: 405 }; // 405 - Method Not Allowed
    }

    // Authorized?
    var authVal = machine.authorized(machineState, urlParams, req);
    checkVal(authVal);
    if(!authVal) {
      return { code: 401 }; // 401 - Unauthorized
    }

    // Forbidden?
    var forbidVal = machine.forbidden(req);
    checkVal(forbidVal);
    if(forbidVal) {
      return { code:  403 }; // 403 - Forbidden}
    }

    // OPTIONS?
    // DEFAULTS TO handleOK
    if(req.method === httpMethods.OPTIONS) {
      if(machine.options) {
        //TODO DOCUMENT THIS
        //this is return handler specific to OPTIONS TODO FIXME XXX
        machine.options(req);
        return;
      } else {
        // CONGRATULATION :D you made a successful HTTP request
        return { code: 200, body: machine.handleOk(machineState, urlParams, req) };
      }
    }


    //*********************************
    // TODO
    // Accept-* handling should go here
    //*********************************
    

    var acceptTypes = decisions.acceptExist(req);
    if(acceptTypes) {
      // TODO compare with machine accept types
    }


    //
    //
    //
    //
    
    // Reource exists?
    // Diagram G-7
    var existVal = machine.exists(machineState, urlParams, req);
    checkVal(existVal);
    if(!existVal) {
      //TODO if match exists -> 412 (Diagram H-7)

      // Diagram i-7
      if(req.method === httpMethods.PUT) {
        //TODO this
        
        var diffUriVal = machine.applyToDifferentUri(req);
        checkVal(diffUriVal);
        if(diffUriVal) {
          return { code: 301 }; // 301 - Moved Permanently
        }

        // COULD POSSIBLY REFACTOR THIS
        var conflictVal = machine.conflict(req);
        checkVal(conflictVal);
        if(conflictVal) {
          return { code: 409 }; // 409 - Conflict
        }

        return writeWithNewResourceCheck(machine, machineState, req, urlParams);

      } else {
        // Diagram K-7
        var existPrevVal = machine.existedPreviously(req);
        checkVal(existPrevVal);
        if(existPrevVal) {

          // Diagram K-5
          var movedPermVal = machine.movedPermanently(req);
          checkVal(movedPermVal);
          if(movedPermVal) {
            return { code: 301 }; // 301 - Moved Permanently
          }

          var movedTempVal = machine.movedTemporarily(req);
          checkVal(movedTempVal);
          if(movedTempVal) {
            return { code: 307 }; // 307 - Moved Temporarily
          } else {
            if(req.method === httpMethods.POST) {

              // Diagram N-5
              if(machine.permitPostToMissingResource) {

                // FIXME actually redirect the user?
                var redirectVal = machine.redirect(req);
                checkVal(redirectVal);
                if(redirectVal) {
                  return { code: 303 }; // 303 - See Other
                } else {
                  return writeWithNewResourceCheck(machine,
                      machineState, req, urlParams);
                }
              } else {
                return { code: 410 }; // 410 - Gone
              }
            } else {
              return { code: 410 }; // 410 - Gone
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

      return { code: 404 };
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
        return { code: 202 }; // 202 - Accepted
      }

      if(deleteFn(req)) {
        return writeResponseWithEntityCheck(machine, machineState, req, urlParams);
      } else { // delete not enacted
        return { code: 202 }; // 202 - Accepted
      }
    }

    // Diagram N-16
    if(req.method === httpMethods.POST) {
      // FIXME actually redirect the user?
      var redirectVal = machine.redirect(req);
      checkVal(redirectVal);
      if(redirectVal) {
        return { code: 303 }; // 303 - See Other
      } else {
        return writeWithNewResourceCheck(machine, machineState, req, urlParams);
      }
    }

    // Diagram O-16
    // TODO write tests
    if(req.method === httpMethods.PUT) {
      // Diagram O-14
      var conflictVal = machine.conflict(req);
      checkVal(conflictVal);
      if(conflictVal) {
        return { code: 409 }; // 409 - Conflict
      }

      return writeWithNewResourceCheck(machine, machineState, req, urlParams);
    } else {
      return writeWithMultipleRepCheck(machine, machineState, req, urlParams);
    }


    if(req.method === httpMethods.GET) {
      return { code: 200, body: machine.handleOk(machineState, urlParams, req) };
    }
  }

  /*
   * THIS IS A VERY IMPORTANT FUNCTION.
   *
   * THIS IS ESSENTIALLY THE ENTRY POINT TO THE WEB MACHINE
   */
  function getWebMachineResponse(machine) {
    return function() {
      var req = this.req,
          res = this.res;

      var args = Array.prototype.slice.call(arguments, 0);
      // TODO test this
      // TODO figure out why I'm sorting
      var urlParams = args.sort();

      var resp = runWebMachine(machine, req, urlParams);
      res.writeHead(resp.code);
      if(resp.body) {
        var body = JSON.stringify(resp.body);
        res.write(body);
      }

      res.end();
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
      get: getWebMachineResponse(machine),
      patch: getWebMachineResponse(machine),
      post: getWebMachineResponse(machine),
      put: getWebMachineResponse(machine),
      delete: getWebMachineResponse(machine)
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

