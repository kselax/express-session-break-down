/*!
 * express-session
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

// it doesn't allow using some syntax
'use strict';

/**
 * Module dependencies.
 * @private
 */
// Basic HTTP cookie parser and serializer for HTTP servers.
var cookie = require('cookie');
// Module for calculating Cyclic Redundancy Check (CRC) for Node.js and the Browser.
var crc = require('crc').crc32;
// A tiny JavaScript debugging utility modelled after Node.js core's debugging technique. Works in Node.js and web browsers.
var debug = require('debug')('express-session');
// Deprecate all the things
// With great modules comes great responsibility; mark things deprecated!
var deprecate = require('depd')('express-session');
// Parse a URL with memoization.
var parseUrl = require('parseurl');
/*URL and cookie safe UIDs
Create cryptographically secure UIDs safe for both cookie and URL usage. This is in contrast to modules such as rand-token and uid2 whose UIDs are actually skewed due to the use of % and unnecessarily truncate the UID. Use this if you could still use UIDs with - and _ in them. */
var uid = require('uid-safe').sync
// Execute a listener when a response is about to write headers.
  , onHeaders = require('on-headers')
// sign and unsign cookies
  , signature = require('cookie-signature')

// here we get function Session to varialbe Session
// for creating an object we have to use a keyword 'new'
var Session = require('./session/session')
  , MemoryStore = require('./session/memory')
  , Cookie = require('./session/cookie')
  , Store = require('./session/store');

// console.log(Session); // [Function: Session]


// environment

var env = process.env.NODE_ENV;
// console.log(env); undefined

/**
 * Expose the middleware.
 */
// export function that uses for initialization in middleware
exports = module.exports = session;

/**
 * Expose constructors.
 */

exports.Store = Store;
exports.Cookie = Cookie;
// constructor for creating session object
exports.Session = Session;
exports.MemoryStore = MemoryStore;

/**
 * Warning message for `MemoryStore` usage in production.
 * @private
 */

// this is string variable
var warning = 'Warning: connect.session() MemoryStore is not\n'
  + 'designed for a production environment, as it will leak\n'
  + 'memory, and will not scale past a single process.';

/**
 * Node.js 0.8+ async implementation.
 * @private
 */

/* istanbul ignore next */
// typeof operator return string value of a variable type
// it might return 'function' if variable setImmediate is function
// what is going on here?
// creating varialbe defer that is has a function that placed in a variable setImmediate,
// if it doesn't have a function it will create own function
//
// setImmediate - This method is used to break up long running operations and run a callback function immediately after the browser has completed other operations such as events and display updates.
// if (err) {
//   defer(next, err);
// }
// in this code setImmediate puts functin to an event loop
// process.nextTick() practically does the same like setImmediate
// both functions accept other function, in our example we do
// defer(next, err); it will setImmediate(next, err) or process.nextTick(next, err)
// where next is a funciton and err is a variable that will pass to next as a argument.
var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }
// console.log(defer); // { [Function: setImmediate] [Symbol(util.promisify.custom)]: [Function] }
/**
 * Setup session store with the given `options`.
 *
 * @param {Object} [options]
 * @param {Object} [options.cookie] Options for cookie
 * @param {Function} [options.genid]
 * @param {String} [options.name=connect.sid] Session ID cookie name
 * @param {Boolean} [options.proxy]
 * @param {Boolean} [options.resave] Resave unmodified sessions back to the store
 * @param {Boolean} [options.rolling] Enable/disable rolling session expiration
 * @param {Boolean} [options.saveUninitialized] Save uninitialized sessions to the store
 * @param {String|Array} [options.secret] Secret for signing session ID
 * @param {Object} [options.store=MemoryStore] Session store
 * @param {String} [options.unset]
 * @return {Function} middleware
 * @public
 */

// this is a main of this middleware
function session(options) {
  // var equal options or object
  var opts = options || {}
  // console.log(opts);
  // get the cookie options
  var cookieOptions = opts.cookie || {}

  // get the session id generate function
  // here is initialization fo generateId function
  // by defult it's generateSessionId
  // function generateSessionId(sess) {
  //   return uid(24);
  // }
  // this is define in bottom
  var generateId = opts.genid || generateSessionId
  // console.log(generateId);
  // get the session cookie name
  var name = opts.name || opts.key || 'connect.sid'

  // get the session store
  // if not exists store we use MemoryStore
  var store = opts.store || new MemoryStore()

  // get the trust proxy setting
  var trustProxy = opts.proxy

  // get the resave session option
  // could be true or false
  var resaveSession = opts.resave;

  // get the rolling session option
  var rollingSessions = Boolean(opts.rolling)

  // get the save uninitialized session option
  // it could be true or false
  var saveUninitializedSession = opts.saveUninitialized

  // get the cookie signing secret
  var secret = opts.secret

  // typeof operator returns string in this case if it doesn't return 'function'
  // will be thrown an exception
  // throw new TypeError('genid option must be a function');
  if (typeof generateId !== 'function') {
    // The TypeError object represents an error when a value is not of the expected type.
    // shortly this thin is spawn an exception
    throw new TypeError('genid option must be a function');
  }

  // if we didn't define resave parameter it will show message
  if (resaveSession === undefined) {
    // it's function from dept module that is mark everything in your module as depricated
    deprecate('undefined resave option; provide resave option');
    resaveSession = true; // this is by default value
  }
  // if you didn't specify explicitely value for saveUninitializedSession
  // you'll get warning message
  if (saveUninitializedSession === undefined) {
    // it's output message for your module, see npm module dept
    deprecate('undefined saveUninitialized option; provide saveUninitialized option');
    saveUninitializedSession = true; // set up default value for
  }

  // console.log(opts.unset); // undefined
  // by default it's undefined
  // here is going on checking, destroy or keep if distinguish than throw an exception
  if (opts.unset && opts.unset !== 'destroy' && opts.unset !== 'keep') {
    // TypeError is object represents an error when a value is not of the expected type
    throw new TypeError('unset option must be "destroy" or "keep"');
  }

  // TODO: switch to "destroy" on next major
  // if opts.unset === destroy our var unsetDestroy will be getting true,
  // by default it gets false
  var unsetDestroy = opts.unset === 'destroy'
  // console.log(unsetDestroy);

  //  what is Array.isArray()
  // Array.isArray - method determines whether the passed value is Array
  // console.log(secret);
  // it's check secret, and if it is empty might throw an exception
  if (Array.isArray(secret) && secret.length === 0) {
    // TypeError - object represents an error when the value is not of the expected type
    throw new TypeError('secret option array must contain one or more strings');
  }

  // if secret == true and secret is not Array
  // it will translate secret to Array
  if (secret && !Array.isArray(secret)) {
    // console.log('here we go');
    // transform secret to Array
    secret = [secret];
    // console.log(secret);
  }

  // check if you didn't specify explicitely secret, you'll get an error
  // from a dept node modules
  if (!secret) {
    // output an error from dept modules by funciton depricated
    deprecate('req.secret; provide secret option');
  }

  // notify user that this store is not
  // meant for a production environment
  /* istanbul ignore next: not tested */
  // output warnings if you use databse by defult MemoryStore that is not used for
  // production, you have to use one other
  if ('production' == env && store instanceof MemoryStore) {
    // outputs the warning message to the web console
    // difference with output in browser console it will have icon
    console.warn(warning);
  }

  // generates the new session
  // what is going on here
  // console.log(store);
  // here we add a new member to object store and asign to it a function
  // other words we add function to our store object
  // store object represents a database, it could be Redis or whatever you wnat
  // here is define a funciton definition
  store.generate = function(req){
    // console.log(req);
    // it has function that use node.js module uid-safe for generating uid
    req.sessionID = generateId(req);
    // this is a session object from file Session = require('./session/session')
    req.session = new Session(req);
    // what is the Cookie object
    // this is object from file Cookie = require('./session/cookie')
    req.session.cookie = new Cookie(cookieOptions);

    // what is going on here?
    if (cookieOptions.secure === 'auto') {
      // issecure - is custom function defined in the bottom
      // trustProxy - is a value from user input opts.proxy
      // definition from npm
      // proxy
      // Trust the reverse proxy when setting secure cookies (via the "X-Forwarded-Proto" header).
      // The default value is undefined.
      // true The "X-Forwarded-Proto" header will be used.
      // false All headers are ignored and the connection is considered secure only if there is a direct TLS/SSL connection.
      // undefined Uses the "trust proxy" setting from express
      // issecure return false or true, here we set up property secure to object Coockie
      req.session.cookie.secure = issecure(req, trustProxy);
    }
    // console.log(this);
  };
  // console.log(store);

  // if typeof return functon than variable true
  var storeImplementsTouch = typeof store.touch === 'function';

  // register event listeners for the store to track readiness
  var storeReady = true
  store.on('disconnect', function ondisconnect() {
    // console.log('here we go disconnect');
    storeReady = false
  })
  store.on('connect', function onconnect() {
    // console.log('here we go connect');
    storeReady = true
  })


  // this is looks like closure
  return function session(req, res, next) {

    // self-awareness
    // if req.session exists go to next middleware
    if (req.session) {
      next()
      return
    }

    // Handle connection as if there is no session if
    // the store has temporarily disconnected etc
    // if database off, go to next middleware by next function and outptu error
    if (!storeReady) {
      // output when DEBUG=express-session node index.js
      debug('store is disconnected')
      next()
      return
    }

    // pathname mismatch
    // [mark]
    // console.log(req);
    // console.log(parseUrl.original(req));
    // console.log(parseUrl(req));
    // console.log(parseUrl.original(req).path);
    // parseUrl it's modul functions parseurl
    var originalPath = parseUrl.original(req).pathname || '/'
    // console.dir(originalPath); // '/'

    // indexOf return position in array;
    // console.log(cookieOptions.path); // undefined
    // if not exists cookieOptions.path than look '/' symbol
    // if !== 0 it means it is not first symbol, go to next middleware
    // console.log(originalPath.indexOf(cookieOptions.path || '/')); // 0
    if (originalPath.indexOf(cookieOptions.path || '/') !== 0) return next();

    // ensure a secret is available or bail
    console.log(req.secret); // undefined
    console.log(secret); // [ 'keyboard cat' ]
    // next(new Error('secret option required for sessions')); // it will stop app and output error
    // next('some text'); // it will output some text
    if (!secret && !req.secret) {
      //The Error constructor creates an error object. Instances of Error objects are thrown when runtime errors occur.
      next(new Error('secret option required for sessions'));
      return;
    }

    // backwards compatibility for signed cookies
    // req.secret is passed from the cookie parser middleware
    // [mark]
    var secrets = secret || [req.secret];

    var originalHash;
    var originalId;
    var savedHash;
    var touched = false

    // expose store
    req.sessionStore = store;

    // get the session ID from the cookie
    var cookieId = req.sessionID = getcookie(req, name, secrets);

    // set-cookie
    onHeaders(res, function(){
      if (!req.session) {
        debug('no session');
        return;
      }

      if (!shouldSetCookie(req)) {
        return;
      }

      // only send secure cookies via https
      if (req.session.cookie.secure && !issecure(req, trustProxy)) {
        debug('not secured');
        return;
      }

      if (!touched) {
        // touch session
        req.session.touch()
        touched = true
      }

      // set cookie
      setcookie(res, name, req.sessionID, secrets[0], req.session.cookie.data);
    });

    // proxy end() to commit the session
    var _end = res.end;
    var _write = res.write;
    var ended = false;
    res.end = function end(chunk, encoding) {
      if (ended) {
        return false;
      }

      ended = true;

      var ret;
      var sync = true;

      function writeend() {
        if (sync) {
          ret = _end.call(res, chunk, encoding);
          sync = false;
          return;
        }

        _end.call(res);
      }

      function writetop() {
        if (!sync) {
          return ret;
        }

        if (chunk == null) {
          ret = true;
          return ret;
        }

        var contentLength = Number(res.getHeader('Content-Length'));

        if (!isNaN(contentLength) && contentLength > 0) {
          // measure chunk
          chunk = !Buffer.isBuffer(chunk)
            ? new Buffer(chunk, encoding)
            : chunk;
          encoding = undefined;

          if (chunk.length !== 0) {
            debug('split response');
            ret = _write.call(res, chunk.slice(0, chunk.length - 1));
            chunk = chunk.slice(chunk.length - 1, chunk.length);
            return ret;
          }
        }

        ret = _write.call(res, chunk, encoding);
        sync = false;

        return ret;
      }

      if (shouldDestroy(req)) {
        // destroy session
        debug('destroying');
        store.destroy(req.sessionID, function ondestroy(err) {
          if (err) {
            defer(next, err);
          }

          debug('destroyed');
          writeend();
        });

        return writetop();
      }

      // no session to save
      if (!req.session) {
        debug('no session');
        return _end.call(res, chunk, encoding);
      }

      if (!touched) {
        // touch session
        req.session.touch()
        touched = true
      }

      if (shouldSave(req)) {
        req.session.save(function onsave(err) {
          if (err) {
            defer(next, err);
          }

          writeend();
        });

        return writetop();
      } else if (storeImplementsTouch && shouldTouch(req)) {
        // store implements touch method
        debug('touching');
        store.touch(req.sessionID, req.session, function ontouch(err) {
          if (err) {
            defer(next, err);
          }

          debug('touched');
          writeend();
        });

        return writetop();
      }

      return _end.call(res, chunk, encoding);
    };

    // generate the session
    function generate() {
      store.generate(req);
      originalId = req.sessionID;
      originalHash = hash(req.session);
      wrapmethods(req.session);
    }

    // wrap session methods
    function wrapmethods(sess) {
      var _reload = sess.reload
      var _save = sess.save;

      function reload(callback) {
        debug('reloading %s', this.id)
        _reload.call(this, function () {
          wrapmethods(req.session)
          callback.apply(this, arguments)
        })
      }

      function save() {
        debug('saving %s', this.id);
        savedHash = hash(this);
        _save.apply(this, arguments);
      }

      Object.defineProperty(sess, 'reload', {
        configurable: true,
        enumerable: false,
        value: reload,
        writable: true
      })

      Object.defineProperty(sess, 'save', {
        configurable: true,
        enumerable: false,
        value: save,
        writable: true
      });
    }

    // check if session has been modified
    function isModified(sess) {
      return originalId !== sess.id || originalHash !== hash(sess);
    }

    // check if session has been saved
    function isSaved(sess) {
      return originalId === sess.id && savedHash === hash(sess);
    }

    // determine if session should be destroyed
    function shouldDestroy(req) {
      return req.sessionID && unsetDestroy && req.session == null;
    }

    // determine if session should be saved to store
    function shouldSave(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        debug('session ignored because of bogus req.sessionID %o', req.sessionID);
        return false;
      }

      return !saveUninitializedSession && cookieId !== req.sessionID
        ? isModified(req.session)
        : !isSaved(req.session)
    }

    // determine if session should be touched
    function shouldTouch(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        debug('session ignored because of bogus req.sessionID %o', req.sessionID);
        return false;
      }

      return cookieId === req.sessionID && !shouldSave(req);
    }

    // determine if cookie should be set on response
    function shouldSetCookie(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        return false;
      }

      return cookieId != req.sessionID
        ? saveUninitializedSession || isModified(req.session)
        : rollingSessions || req.session.cookie.expires != null && isModified(req.session);
    }

    // generate a session if the browser doesn't send a sessionID
    if (!req.sessionID) {
      debug('no SID sent, generating session');
      generate();
      next();
      return;
    }

    // generate the session object
    debug('fetching %s', req.sessionID);
    store.get(req.sessionID, function(err, sess){
      // error handling
      if (err) {
        debug('error %j', err);

        if (err.code !== 'ENOENT') {
          next(err);
          return;
        }

        generate();
      // no session
      } else if (!sess) {
        debug('no session found');
        generate();
      // populate req.session
      } else {
        debug('session found');
        store.createSession(req, sess);
        originalId = req.sessionID;
        originalHash = hash(sess);

        if (!resaveSession) {
          savedHash = originalHash
        }

        wrapmethods(req.session);
      }

      next();
    });
  }; // return function session(req, res, next) /* it might a closure */
}; // function session(options) /* main function of all middleware */

/**
 * Generate a session ID for a new session.
 *
 * @return {String}
 * @private
 */

function generateSessionId(sess) {
  // this is npm module uid-safe
  // Create cryptographically secure UIDs safe for both cookie and URL usage.
  return uid(24);
}

/**
 * Get the session ID cookie from request.
 *
 * @return {string}
 * @private
 */

function getcookie(req, name, secrets) {
  var header = req.headers.cookie;
  var raw;
  var val;

  // read from cookie header
  if (header) {
    var cookies = cookie.parse(header);

    raw = cookies[name];

    if (raw) {
      if (raw.substr(0, 2) === 's:') {
        val = unsigncookie(raw.slice(2), secrets);

        if (val === false) {
          debug('cookie signature invalid');
          val = undefined;
        }
      } else {
        debug('cookie unsigned')
      }
    }
  }

  // back-compat read from cookieParser() signedCookies data
  if (!val && req.signedCookies) {
    val = req.signedCookies[name];

    if (val) {
      deprecate('cookie should be available in req.headers.cookie');
    }
  }

  // back-compat read from cookieParser() cookies data
  if (!val && req.cookies) {
    raw = req.cookies[name];

    if (raw) {
      if (raw.substr(0, 2) === 's:') {
        val = unsigncookie(raw.slice(2), secrets);

        if (val) {
          deprecate('cookie should be available in req.headers.cookie');
        }

        if (val === false) {
          debug('cookie signature invalid');
          val = undefined;
        }
      } else {
        debug('cookie unsigned')
      }
    }
  }

  return val;
}

/**
 * Hash the given `sess` object omitting changes to `.cookie`.
 *
 * @param {Object} sess
 * @return {String}
 * @private
 */

function hash(sess) {
  return crc(JSON.stringify(sess, function (key, val) {
    // ignore sess.cookie property
    if (this === sess && key === 'cookie') {
      return
    }

    return val
  }))
}

/**
 * Determine if request is secure.
 *
 * @param {Object} req
 * @param {Boolean} [trustProxy]
 * @return {Boolean}
 * @private
 */

// function return false or true
function issecure(req, trustProxy) {
  // socket is https server
  // if exists connection and encrypted, return true
  if (req.connection && req.connection.encrypted) {
    return true;
  }

  // do not trust proxy
  // if we set up opt.proxy to false
  if (trustProxy === false) {
    return false;
  }

  // no explicit trust; try req.secure from express
  if (trustProxy !== true) {
    var secure = req.secure;
    // typeof return string 'boolen', then secure = secure, else false
    return typeof secure === 'boolean'
      ? secure
      : false;
  }

  // read the proto from x-forwarded-proto header
  var header = req.headers['x-forwarded-proto'] || '';
  // indexOf returns the first index where element could be found
  // it will seek ',' index in header array
  // in this case header is array of symbols
  var index = header.indexOf(',');
  // if something found proto = index and index != -1 (means something was found by header.indexOf(','))
  var proto = index !== -1
    // substr return string from 0 to index in lowercase
    ? header.substr(0, index).toLowerCase().trim()
    // simply translate header to lowercase
    : header.toLowerCase().trim()
  // if proto === https return true
  return proto === 'https';
}

/**
 * Set cookie on response.
 *
 * @private
 */

function setcookie(res, name, val, secret, options) {
  var signed = 's:' + signature.sign(val, secret);
  var data = cookie.serialize(name, signed, options);

  debug('set-cookie %s', data);

  var prev = res.getHeader('set-cookie') || [];
  var header = Array.isArray(prev) ? prev.concat(data) : [prev, data];

  res.setHeader('set-cookie', header)
}

/**
 * Verify and decode the given `val` with `secrets`.
 *
 * @param {String} val
 * @param {Array} secrets
 * @returns {String|Boolean}
 * @private
 */
function unsigncookie(val, secrets) {
  for (var i = 0; i < secrets.length; i++) {
    var result = signature.unsign(val, secrets[i]);

    if (result !== false) {
      return result;
    }
  }

  return false;
}
