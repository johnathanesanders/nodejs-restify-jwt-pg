'use strict';
const auth = require('../models/auth');
const errs = require('restify-errors');
const model = require('../models/ingredient');
const router = require('restify-router').Router;
const routerInstance = new router();

// Authentication middleware - we place it in each controller because some content may not need authentication
routerInstance.use(function (req, res, next) {

    auth.findByToken(req.headers['x-access-token'], function (code, result) {
        if (code === 200) {
            return next();
        } else {
            return next(new errs.UnauthorizedError());
        }
    });

});

// Authenticated router paths
routerInstance.get('/ingredient', function (req, res, next) {

    auth.read(req.headers['x-access-token'], function (code, result) {
        if (code === 200) {
            var owner = result.id;
            model.getAll(owner, function (code, result) {
                res.send(code, result);
                return next();
            });
            return next();
        } else {
            return next(new errs.UnauthorizedError());
        }
    });

   
});

module.exports = routerInstance;