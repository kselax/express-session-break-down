/*!
 * Connect - session - Session
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

// this is forbid some syntaxes
// if you see this it means some code could not work properly
'use strict';

/**
 * Expose Session.
 */

// exort our function Session
// in JavaScript definition for Object and functons are equal
module.exports = Session;

/**
 * Create a new `Session` with the given request and `data`.
 *
 * @param {IncomingRequest} req
 * @param {Object} data
 * @api private
 */

// this is function create session object
function Session(req, data) {
  // add a new property to an object
  // this is object
  // req - name of property
  // { value: req } - options
  Object.defineProperty(this, 'req', { value: req });

  // this defines an id variable
  Object.defineProperty(this, 'id', { value: req.sessionID });

  // if data is object and data not equal null
  // typeof it's an operator that accepts expression of value and returns string 'boolien', 'number', 'string', etc
  if (typeof data === 'object' && data !== null) {
    // merge data into this, ignoring prototype properties

    // this is loop (for...in) over all properties of data object
    for (var prop in data) {
      // console.log(prop);
      // this is (if...in) return true of false
      // in this case we check if not exists prop property in a current object
      // then add it to object
      if (!(prop in this)) {
        this[prop] = data[prop];
        // console.log(this);
        // output
        // Session {
        // cookie:
        //  { path: '/',
        //    _expires: 2018-06-20T18:03:40.450Z,
        //    originalMaxAge: 60000,
        //    httpOnly: true },
        // views: 1 }
      }
    }
  }
}

/**
 * Update reset `.cookie.maxAge` to prevent
 * the cookie from expiring when the
 * session is still active.
 *
 * @return {Session} for chaining (for chaining means like in jquery sequvel of calls .f1().f2().f3())
 * @api public
 */

// this function is wrapper for Object.defineProperty()
// Object.defineProperty - this function accepts an objects and add to an object properties
// it looks like Session.prototype is an object and not property at all
// when we do object
// touch is name of added property
// last parameter is function
defineMethod(Session.prototype, 'touch', function touch() {
  return this.resetMaxAge();
});

/**
 * Reset `.maxAge` to `.originalMaxAge`.
 *
 * @return {Session} for chaining
 * @api public
 */

// this function is wrapper for Object.defineProperty()
// it accepts object, property name and functon
// in this case Session.prototype is an object
// resetMaxAge is property name and
// last function
defineMethod(Session.prototype, 'resetMaxAge', function resetMaxAge() {
  this.cookie.maxAge = this.cookie.originalMaxAge;
  return this;
});

/**
 * Save the session data with optional callback `fn(err)`.
 *
 * @param {Function} fn
 * @return {Session} for chaining
 * @api public
 */

// this function is wrapper for Object.defineProperty
// variables: Object, method name, function
// Session.prototype - is an object
// save is a new method
// last function
defineMethod(Session.prototype, 'save', function save(fn) {
  this.req.sessionStore.set(this.id, this, fn || function(){});
  return this;
});

/**
 * Re-loads the session data _without_ altering
 * the maxAge properties. Invokes the callback `fn(err)`,
 * after which time if no exception has occurred the
 * `req.session` property will be a new `Session` object,
 * although representing the same session.
 *
 * @param {Function} fn
 * @return {Session} for chaining
 * @api public
 */
// custom function it is a wrapper for function Object.defineProperty
// accepts Object (Session.prototype), property name (reload), function
//
defineMethod(Session.prototype, 'reload', function reload(fn) {
  var req = this.req
    , store = this.req.sessionStore;
  // calls a get function of sessionStore. It should be redis function or any
  // that serves database
  // get( key ). it should return value in back
  store.get(this.id, function(err, sess){
    if (err) return fn(err);
    if (!sess) return fn(new Error('failed to load session'));
    // it might method of store object
    // each session has its own store
    store.createSession(req, sess);
    fn();
  });
  // return object for chaining
  return this;
});

/**
 * Destroy `this` session.
 *
 * @param {Function} fn
 * @return {Session} for chaining
 * @api public
 */
// custome functin wrapper for Object.defineProperty
// accepts 3 artuments Object in our case it's Session.prototype
// property name it's 'destroy'
// and function implementation
defineMethod(Session.prototype, 'destroy', function destroy(fn) {
  // The JavaScript delete operator removes a property from an object;
  // if no more references to the same property are held, it is eventually released automatically.
  delete this.req.session;
  this.req.sessionStore.destroy(this.id, fn);
  return this; // return object for chaining
});

/**
 * Regenerate this request's session.
 *
 * @param {Function} fn
 * @return {Session} for chaining
 * @api public
 */
// custom function wrapper for Object.defineProperty
// accepts an Object Session.prototype
// method name 'regenerate'
// function implementation
defineMethod(Session.prototype, 'regenerate', function regenerate(fn) {
  this.req.sessionStore.regenerate(this.req, fn);
  return this; // return this for chaining
});

/**
 * Helper function for creating a method on a prototype.
 *
 * @param {Object} obj
 * @param {String} name
 * @param {Function} fn
 * @private
 */
 // wrapper functon for Object.defineProperty
function defineMethod(obj, name, fn) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: false,
    value: fn,
    writable: true
  });
};
