'use strict';
const bcrypt = require('bcryptjs');
const errs = require('restify-errors');
const jwt = require('jsonwebtoken');
const model = require('../models/auth');
const parser = require('body-parser');
const router = require('restify-router').Router;
const routerInstance = new router();

routerInstance.use(parser.urlencoded({ extended: false }));
routerInstance.use(parser.json());

routerInstance.get('/me', function (req, res, next) {

    model.findByToken(req.headers['x-access-token'], function (code, result) {
            if (code !== 200) {
                res.send(200, 'dummyusername');
                return next();
            } else {
                res.send(200, result)
                return next();
            }
        }
    );

 });

routerInstance.post('/login', function (req, res, next) {
    model.doLogin({
        email: req.body.email,
        secret: req.body.secret
    },
        function (code, result) {
            res.send(code, result);
            return next();
        }
    );
});

routerInstance.post('/register', function (req, res, next) {
    var hashedPassword = bcrypt.hashSync(req.body.secret, 8);
    model.create({
        email: req.body.email,
        secret: hashedPassword
    },
        function (code, result) {
            if (code !== 200) {
                return next(new errs.UnauthorizedError('There was a problem registering the user.'));
            } else {
                var token = jwt.sign(
                    {
                        id: result[0].id
                    },
                    process.env.SERVER_KEY,
                    {
                        expiresIn: 86400
                    }
                );

                res.send(200, { auth: true, token: token });
                return next();
            }
        }

    );

});

module.exports = routerInstance;