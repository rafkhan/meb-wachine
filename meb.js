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


  // Diagram O-18
  // Checks if an entity has multiple representations, sends 303 if so.
  // If not, it runs handleOk.
  function writeWithMultipleRepCheck(machine, req) {
    if(machine.hasMultipleRepresentations(req)) {
      return { code: 300 }; // 300 - Multiple Choices
    } else {
      //FIXME
      machine.handleOk(req, res); // 200 - Ok
      return;
    }
  }

  // Diagram O-20
  // This checks if the response includes an entity with potentially
  // multiple representations. This will write and close the result stream.
  function writeResponseWithEntityCheck(machine, req) {
    if(machine.respondWithEntity) {
      return writeWithMultipleRepCheck(machine, req);
    } else {
      return { code: 204 }; // 204 - No Content
    } 
  }

  // Diagram P-11
  function writeWithNewResourceCheck(machine, req) {
    if(machine.newResource(req)) {
      //TODO check response value should be for 201
      return { code: 201 }; // 201 - Created
    } else {
      return writeResponseWithEntityCheck(machine, req);
    }
  }

  /*
    * THE RETURN VALUESHOULD BE IN THE FOLLOWING FORMAT
    * {
    *   code: 200,
    *   data:   {}, // empty resp body if excluded
    * }
    */
  function runWebMachine(machine, req, res) {
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
      return { code: 405 }; // 405 - Method Not Allowed
    }

    // Authorized?
    if(!machine.authorized(req)) {
      return { code: 401 }; // 401 - Unauthorized
    }

    // Forbidden?
    if(machine.forbidden(req)) {
      return { code:  403 }; // 403 - Forbidden}
    }

    // OPTIONS?
    // DEFAULTS TO handleOK
    if(req.method === httpMethods.OPTIONS) {
      if(machine.options) {

        //TODO return value
        machine.options(req, res);
        return;
      } else {

        //TODO return value
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
          return { code: 301 }; // 301 - Moved Permanently
        }

        // COULD POSSIBLY REFACTOR THIS
        if(machine.conflict(req)) {
          return { code: 409 }; // 409 - Conflict
        }

        return writeWithNewResourceCheck(machine, req);

      } else {
        // Diagram K-7
        if(machine.existedPreviously(req)) {
          // Diagram K-5
          if(machine.movedPermanently(req)) {
            return { code: 301 }; // 301 - Moved Permanently
          }

          if(machine.movedTemporarily(req)) {
            return { code: 307 }; // 307 - Moved Temporarily
          } else {
            if(req.method === httpMethods.POST) {
              // Diagram N-5
              if(machine.permitPostToMissingResource) {
                if(machine.redirect(req)) {
                  return { code: 303 }; // 303 - See Other
                } else {
                  // FIXME
                  return writeWithNewResourceCheck(machine, req);
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
        return writeResponseWithEntityCheck(req, res, machine);
      } else { // delete not enacted
        return { code: 202 }; // 202 - Accepted
      }
    }

    // Diagram N-16
    if(req.method === httpMethods.POST) {
      if(machine.redirect(req)) {
        return { code: 303 }; // 303 - See Other
      } else {
        return writeWithNewResourceCheck(req, res, machine);
      }
    }

    // Diagram O-16
    // TODO write tests
    if(req.method === httpMethods.PUT) {
      // Diagram O-14
      if(machine.conflict(req)) {
        return { code: 409 }; // 409 - Conflict
      }

      return writeWithNewResourceCheck(req, res, machine);
    } else {
      return writeWithMultipleRepCheck(req, res, machine);
    }


    if(req.method === httpMethods.GET) {
      return machine.handleOk(req, res);
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

      var resp = runWebMachine(machine, req, res);
      console.log(resp);
      res.writeHead(resp.code);
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

