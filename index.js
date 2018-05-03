'use strict';

const debug = require('debug')("loader-mw:debug");
const error = require('debug')("loader-mw:error");
const createError = require('http-errors');

const handleError = err => {
  // An Error with statusCode => pass throught
  if (err instanceof Error && err.statusCode) {
    return err;
  }

  // try to find message and status, if not found creates an error 500
  let msg = undefined;
  let status = 500;
  if(typeof err === 'string') {
    msg = err;
  }
  else if (err.message) {
    msg = err.message;
    status = err.statusCode || err.status || 500;
  }
  return createError(status, msg);
};
/**
 *
 * Factory for the middleware.
 * @param accessorFn function to retrieve the parameter, gets id and request, returns the value or a promise of the
 * value
 * @param usedName which contains the id of the parameter to load, if undefined (default) the fifth argument of the
 * middleware function which is the parameter name is used
 * @param raiseErr (false by default) in case of an error, if true raises the error, i.e. calls next with error, if
 * false ignore the error (nevertheless the the ressource cannot be loaded)
 * @returns {Function} the param middleware function
 */
module.exports = (accessorFn, usedName = null, raiseErr = false) => {
  // first parameter should be a function ...
  if (typeof accessorFn !== 'function') {
    throw Error(`Please define the access method as first parameter of the middleware factory.`);
  }
  // ... with ane and only one argument
  const args = accessorFn.toString().match(/\(\s*([^)]*)\)/m)[1];
  if (args.split(/,/).length !== 2) {
    throw Error(`The access method as first parameter need two and only two arguments`);
  }

  debug(`loader created`);
  return (req, res, next, id, paramName) => {
    const name = usedName || paramName;
    const setValue = value => {
      debug(`${name} "${id}" loaded`);
      const result = raiseErr ? value : { value, err: null };
      if (typeof req.setPrm === 'function') {
        req.setPrm(name, result);
      }
      else {
        req[name] = result;
      }
      next();
    };
    const setErr = err => {
      err = handleError(err);
      error(`Unknow ${name} "${id}": ${err.message}`);
      if (raiseErr) {
        next(err);
      }
      else {
        const result = { value: null, err };
        if (typeof req.setPrm === 'function') {
          req.setPrm(name, result);
        }
        else {
          req[name] = result;
        }
        next();
      }
    };

    try {
      const value = accessorFn(id, req);
      if(value instanceof Promise) {
        value
          .then(setValue)
          .catch(setErr);
      }
      else if (value instanceof Error) {
        setErr(value);
      }
      else {
        setValue(value);
      }
    }
    catch (err) {
      setErr(err);
    }
  };
};
