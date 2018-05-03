# Load a ressource
This middleware allows to load a resource based on the parameter id provided. 
This middleware is designed to be used with 
[`app.param`](http://expressjs.com/en/4x/api.html#app.param) or 
[`router.param`](http://expressjs.com/en/4x/api.html#router.param).
The request should support custom parameters (see 
[req-custom](https://github.com/benco1967/req-custom)) to store the loaded 
resource, if not, the parameter will be added directly to the req object 
without warranty of key collision.

## Factory parameters
The package provides a factory to create the middleware, the parameters used are:

+ **accessorFn :** `(id, req) => Promise(value)|value` the accessor function,
gets the id and the request object, should provide a *Promise* of the loaded 
ressource, or directly the resource. If an *Error* happens should throw an *Error*
or reject the *Promise*.
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
Just the accessor function:
```javascript
const tenants = require('./models/tenants');
const tenantLoader = require('pre-loader-mw');

// the resource loader
const accessorFn = (id, req) => tenants.get(id);
app.param(['user', 'page'], tenantLoader(accessorFn));

// Do something with the user ':user'
app.get('tenant/:user', function(req, res, next) {
  // the key of the added field is the name of the parameter
  const err = req['user'].err;
  if (err) {
    // Do something with the Error
    // here req.user.value === null
  }
  else {
    // Do something with the user
    // here req.user.err === null
    const user = req['user'].value;
  }
});
// Do something with the page ':page'
app.get('pages/:page', function(req, res, next) {
  const pageField = req['page'];
  const page = pageField.value;
  if (page !== null) {
    // Do something with the page
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
const accessorFn = id => rsrcs.get(id);
app.param('paramId', rsrcLoader(accessorFn, 'params', true));

// Do something with the resource ':rsrcId'
app.get('something/:paramId', function(req, res, next) {
  // The params is here, no collision with req.params
  const params = req.getPrm('params');
});
app.use(function(err, req, res, next) {
  // Error will be handle here
});
```
