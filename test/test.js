const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);
const expect = chai.expect;
const createError = require('http-errors');
const customParams = require('req-custom');
const preLoader = require('../index.js');


describe('Loader', function() {

  describe('Loader factory', function() {

    it('throw error if no name', function () {
      expect(() => preLoader()).to.throw("Please define the access method as first parameter of the middleware factory.");
    });
    it('throw error if no accessor', function () {
      expect(() => preLoader('foo')).to.throw("Please define the access method as first parameter of the middleware factory.");
    });
    it('error if accessor provided has no arguments', function () {
      expect(() => preLoader(() => null)).to.throw("The access method as first parameter need two and only two arguments");
    });
    it('error if accessor provided has more than one argument', function () {
      expect(() => preLoader((a, b, c) => null)).to.throw("The access method as first parameter need two and only two arguments");
    });
    it('no error if accessor provided', function () {
      expect(() => preLoader((id, req) => null)).to.not.throw();
      expect(() => preLoader(function(id, req) {})).to.not.throw();
    });

  });

  describe('Load the object', function() {
    it('call the accessor and set the foo with promise', function (done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => {
        accessorSpy(id, req);
        return Promise.resolve('payload');
      };
      const loader = preLoader(accessorFn, 'foo');
      const req = {};
      customParams()(req);
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.getPrm('foo', 'value')).to.have.be.equals('payload');
        expect(req.getPrm('foo', 'err')).to.have.be.equals(null);
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });

    it('call the accessor and set the foo with value', function (done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => {
        accessorSpy(id, req);
        return 'payload';
      };
      const loader = preLoader(accessorFn, 'foo');
      const req = {};
      customParams()(req);
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.getPrm('foo', 'value')).to.have.be.equals('payload');
        expect(req.getPrm('foo', 'err')).to.have.be.equals(null);
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });

    it('call the accessor with req without custom parameter', function (done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => {
        accessorSpy(id, req);
        return 'payload';
      };
      const loader = preLoader(accessorFn, 'foo');
      const req = {};
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.foo.value).to.have.be.equals('payload');
        expect(req.foo.err).to.have.be.equals(null);
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });

    it('call the accessor with req without custom parameter', function (done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => {
        accessorSpy(id, req);
        return 'payload';
      };
      const loader = preLoader(accessorFn, 'foo', true);
      const req = {};
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.foo).to.have.be.equals('payload');
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });

    it('call the accessor and set the parameter name with value', function (done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => {
        accessorSpy(id, req);
        return 'payload';
      };
      const loader = preLoader(accessorFn);
      const req = {};
      customParams()(req);
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.getPrm('paramName', 'value')).to.have.be.equals('payload');
        expect(req.getPrm('paramName', 'err')).to.have.be.equals(null);
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });
  });

  describe('Cannot load the object', function() {

    function testErrorPromise(err, msg, status, done, name = 'foo') {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => { accessorSpy(id, req); return Promise.reject(err); };
      const loader = preLoader(accessorFn, name);
      const req = {};
      customParams()(req);
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.getPrm(name, 'value')).to.have.be.equals(null);
        expect(req.getPrm(name, 'err', 'message')).to.have.be.equals(msg);
        expect(req.getPrm(name, 'err', 'statusCode')).to.have.be.equals(status);
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    }

    it('call the accessor with Not Found error with foo', function(done) {
      testErrorPromise(createError(404), 'Not Found', 404, done);
    });
    it('call the accessor with Not Found error with another-name', function(done) {
      testErrorPromise(createError(404), 'Not Found', 404, done, 'another-name');
    });

    it('call the accessor with Internal Server Error', function(done) {
      testErrorPromise(createError(500), 'Internal Server Error', 500, done);
    });

    it('call the accessor with Internal Server Error with a message', function(done) {
      testErrorPromise('error message', 'error message', 500, done);
    });

    it('call the accessor with a message that result in an Internal Server Error', function(done) {
      testErrorPromise('error message', 'error message', 500, done);
    });

    it('call the accessor throws an Error', function(done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => {
        accessorSpy(id, req);
        throw createError(404);
      };
      const loader = preLoader(accessorFn, 'foo');
      const req = {};
      customParams()(req);
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.getPrm('foo', 'value')).to.have.be.equals(null);
        expect(req.getPrm('foo', 'err', 'message')).to.have.be.equals('Not Found');
        expect(req.getPrm('foo', 'err', 'statusCode')).to.have.be.equals(404);
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });

    it('call the accessor returns an Error', function(done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => {
        accessorSpy(id, req);
        return createError(404);
      };
      const loader = preLoader(accessorFn, 'foo');
      const req = {};
      customParams()(req);
      const res = {};
      const next = (err) => {
        expect(err).to.be.undefined;
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.getPrm('foo', 'value')).to.have.be.equals(null);
        expect(req.getPrm('foo', 'err', 'message')).to.have.be.equals('Not Found');
        expect(req.getPrm('foo', 'err', 'statusCode')).to.have.be.equals(404);
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });

    it('call the accessor with raiseErr, call next with an Internal Server Error', function(done) {
      const accessorSpy = sinon.spy();
      const accessorFn = (id, req) => { accessorSpy(id, req); return Promise.reject('error message'); };
      const loader = preLoader(accessorFn, 'foo', true);
      const req = {};
      customParams()(req);
      const res = {};
      const next = (err) => {
        expect(err).not.to.be.undefined;
        expect(err.message).to.have.be.equals('error message');
        expect(err.statusCode).to.have.be.equals(500);
        expect(accessorSpy).to.have.been.calledWithExactly('paramValue', req);
        expect(req.hasPrm('foo')).to.have.be.false;
        done();
      };

      loader(req, res, next, 'paramValue', 'paramName');
    });

  });

});