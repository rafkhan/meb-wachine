/**
 * Contains default
 *
 * @module defaultWM
 */

var _           = require('lodash');
var httpMethods = require('./methods');

 
/**
 * Test if the URI is too long.
 * <em>Triggers 414</em>
 *
 * @type Function
 * @param  {Object}  req  Request object.
 * @returns {boolean}
 * @static
 */
function uriTooLarge(req) { //TODO: test this.
  if(req.url.length > 4096) {
    return true;
  }
  return false;
}

/**
 * Test if the request is authorized to access this resource.
 * <em>Triggers 401</em>
 *
 * @type Function
 * @param  {Object}  req  Request object.
 * @returns {boolean}
 * @static
 */
function authorized() { return true; }

/**
  * Test if the request is forbidden from accessing this resource.
  * <em>Triggers 403</em>
  *
  * @type Function
  * @param  {Object}  req  Request object.
  * @returns {boolean}
  * @static
  */
function forbidden() { return false; }

/**
 * TODO implement this in meb.js<br />
 * Test if request is too large.
 * <em>Triggers TODO</em>
 *
 * @type Function
 * @param  {Object}  req  Request object.
 * @returns {boolean}
 * @static
 */
function tooLarge() { return false; } //FIXME

/**
 * Check if the resource exists.
 * <em>Should trigger 404</em> unless the decision graph
 * was modified to do otherwise.
 *
 * @type Function
 * @param  {Object}  req  Request object.
 * @returns {boolean}
 * @static
 */
function exists() { return true; }

/**
 * Check if the resource existed previously.
 *
 * @type Function
 * @param  {Object}  req  Request object.
 * @returns {boolean}
 * @static
 */
function existedPreviously() { return false; }


var defaultWM = {
  /**
   * HTTP methods that the server knows.
   * Should not be modified.
   * <em>Triggers 501.</em>
   *
   * @var knownMethods
   * @type Array
   * @default All values in {@link Meb.methods}
   * @static
   */
  knownMethods: _.values(httpMethods),

  /**
   * HTTP methods which your resource allows.
   * <b>You should always explicitly specify this.</b>
   * <em>Triggers 405.</em>
   *
   * @var allowedMethods
   * @type Array  
   * @default ['GET']
   * @static
   */
  allowedMethods: [httpMethods.GET],

  /**
   * Do you allow POST-ing to a missing resource?
   *
   * @var permitPostToMissingResource
   * @type boolean
   * @default true
   * @static
   */
  permitPostToMissingResource: true,

  uriTooLarge: uriTooLarge,
  authorized: authorized,
  forbidden: forbidden,
  tooLarge: tooLarge,
  exists: exists,
  existedPreviously: existedPreviously
};


exports = module.exports = defaultWM;
