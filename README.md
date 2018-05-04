# Load a ressource
This middleware allows to load a resource based on the parameter id provided. 
This middleware is designed to be used with 
[`app.param`](http://expressjs.com/en/4x/api.html#app.param) or 
[`router.param`](http://expressjs.com/en/4x/api.html#router.param).
The request object can use custom parameters (see 
[req-custom](https://github.com/benco1967/req-custom)) to store the loaded 
resource and avoid collision with existing keys. If the request has not
custom parameter, the resource will be added directly to the request object.

## Factory parameters
The package provides a factory to create the middleware, the parameters used are:

+ **accessorFn :** `(id, name, req) => Promise(value)|value` the accessor function,
gets the id (the value of the parameter), the name of the parameter and the request 
object. It should provide a *Promise* of the loaded ressource, or directly the 
resource. If an *Error* happens, it should throw an *Error* or reject the *Promise*.
+ **name :** The name of the key used to store the loaded value. If undefined 
the name of the parameter is used.
+ **raiseErr :**
  - if true, the field added to the request objet is directly the value, if the 
  accessorFn fails (throw Error, or promise rejection) the error is propagated 
  to the next middleware
  - if false *(default)*, the field added to the request objet is an object 
  which encapsulates the value and the Error, like this 
  `{ value : value|null, err: null|Error }`. The next middleware is call 
  normally.

## Use cases


### First example
A typical usage is to use this middleware to retrieve the tenant, then the tenant 
can be used by the access control middleware or the controller to process the 
request.

Just the accessor function:
```javascript
const tenants = require('./models/tenants');
const tenantLoader = require('pre-loader-mw');

// the resource loader
const accessorFn = (id) => tenants.get(id);
app.param('tenant', tenantLoader(accessorFn));

// Do something with the tenant for the access control
app.use('/:tenant', function(req, res, next) {
  // the key of the added field is the name of the parameter
  const err = req.tenant.err;
  if (err) {
    // Do something with the Error
    // here req.tenant.value === null
  }
  else {
    // Do something with the tenant
    // here req.tenant.err === null
    const tenant = req.tenant.value;
  }
});
```

### Other example
With a parameter name, error raised and custom parameter middleware:
```javascript
const rsrcs = require('./models/rsrc');
const rsrcLoader = require('pre-loader-mw');

// To add custom parameter to the requests
app.use(require('custom-params'));

// the resource loader
const accessorFn = (id, name, req) => rsrcs.get(id);
app.param(['image', 'video'], rsrcLoader(accessorFn, 'params', true));

// Do something with the resource ':image' or ':video'
app.get(['images/:image', 'video/:video'], function(req, res, next) {
  // The resource is here, and the 'params' name doesn't collide with the req.params
  const rsrc = req.getPrm('params');
});
app.use(function(err, req, res, next) {
  // Error will be handle here
});
```
