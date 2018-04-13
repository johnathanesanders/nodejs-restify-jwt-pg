'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const restify = require('restify');

var controller = {};

controller.auth = require('./controllers/auth');
controller.ingredient = require('./controllers/ingredient');

var server = restify.createServer();

controller.auth.applyRoutes(server);
controller.ingredient.applyRoutes(server);

server.listen(8008, function () {
    console.log('%s listening at %s', server.name, server.url);
});

