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
 * @default true if url > 4096
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
 * @default true
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
  * @default false
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
 * @default false
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
 * @default true
 * @returns {boolean}
 * @static
 */
function exists() { return true; }

/**
 * Check if the resource existed previously.
 *
 * @type Function
 * @param  {Object}  req  Request object.
 * @default false
 * @returns {boolean}
 * @static
 */
function existedPreviously() { return false; }

/**
 * Delete an entity.<br />
 * Return false if you did not enact a delete operation, we will
 * return 202 Accepted. Otherwise you should return a true value
 * to signify that you deleted a resource.
 * 
 * @type Function
 * @param  {Object}  req  Request object.
 * @returns {boolean}
 * @default null
 * @static
 */
var onDelete = null;

/**
 * Does the machine have multiple representations of this resource?
 * <em>Triggers 300 - Multiple Choices</em>
 *
 * @type Function
 * @param  {Object}  req  Request object.
 * @default false
 * @returns {boolean}
 * @static
 */
function hasMultipleRepresentations() { return false; }

/**
 * Should the user be redirected?
 *
 * @type Function
 * @param  {Object}  req  Request object
 * @default false
 * @returns {boolean}
 * @static
 */
function redirect() { return false; }

/**
 * Is a new resource being created?
 * <em>Triggers 201 - Created</em>
 *
 * @type Function
 * @param  {Object}  req  Request object
 * @default false
 * @returns {boolean}
 * @static
 */
function newResource() { return false; }

/**
 * Does the request cause a conflict?
 * <em>Triggers 409 - Conflict </em>
 *
 * @type Function
 * @param  {Object}  req  Request object
 * @default false
 * @returns {boolean}
 * @static
 */
function conflict() { return false; }

/**
 * Server desires that the request be applied to a different URI?
 * <em>Triggers 301 - Moved Permanently</em>
 *
 * @type Function
 * @param  {Object}  req  Request object
 * @default false
 * @returns {boolean}
 * @static
 */
function applyToDifferentUri() { return false; }

/**
 * Resource moved permanently?
 * <em>Triggers 301 - Moved Permanently</em>
 *
 * @type Function
 * @param  {Object}  req  Request object
 * @default false
 * @returns {boolean}
 * @static
 */
function movedPermanently() { return false; }


/**
 * Resource moved temporarily?
 * <em>Triggers 301 - Moved Permanently</em>
 *
 * @type Function
 * @param  {Object}  req  Request object
 * @default false
 * @returns {boolean}
 * @static
 */
function movedTemporarily() { return false; }
 

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

  /**
   * Does the response include a representation of the resource?
   * <em>If false, triggers 204 - No Content</em>
   *
   * @var respondWithEntity
   * @type boolean
   * @default true
   * @static
   */
  respondWithEntity: true,

 

  uriTooLarge: uriTooLarge,
  authorized: authorized,
  forbidden: forbidden,
  tooLarge: tooLarge,
  exists: exists,
  existedPreviously: existedPreviously,
  onDelete: onDelete,
  hasMultipleRepresentations: hasMultipleRepresentations,
  redirect: redirect,
  newResource: newResource,
  conflict: conflict,
  applyToDifferentUri: applyToDifferentUri,
  movedPermanently: movedPermanently,
  movedTemporarily: movedTemporarily

};


exports = module.exports = defaultWM;
