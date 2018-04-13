'use strict';
const bcrypt = require('bcryptjs');
const db = require('../db');
const errs = require('restify-errors');
const jwt = require('jsonwebtoken');
const moment = require('moment');

module.exports = {
    create: function (data, next) {
        db.create('INSERT INTO AUTH(EMAIL, SECRET) VALUES($1, $2) RETURNING id', [data.email.toLowerCase(), data.secret], function (queryResult) {
            if (queryResult.code === 200) {
                typeof (next) === 'function' ? next(queryResult.code, queryResult.data.rows) : console.error('In Models > Auth > create, next() is not a function.');
            } else {
                typeof (next) === 'function' ? next(queryResult.code, queryResult.message) : console.error('In Models > Auth > create, next() is not a function.');
            }
        });
    },
    /**
      *
      * @doLogin This function takes a data and next argument and returns an authentication token if credentials passed into data are successfully validated.
      *
     **/
    doLogin: function (data, next) {
        db.query('SELECT ID, SECRET FROM AUTH WHERE EMAIL=$1', [data.email.toLowerCase()], function (queryResult) {

            // Ensure we did not encounter an error with the query
            if (queryResult.code === 200) {

                // Confirm that we did get a result back

                if (queryResult.data.rowCount > 0) {

                    // We have results from the query, so we need to compare the passwords using bcrypt.compareSync()
                    var passwordIsValid = bcrypt.compareSync(data.secret, queryResult.data.rows[0].secret);

                    if (passwordIsValid) {

                        // Password appears to be valid, so generate the token with jwt.sign() and respond
                        var token = jwt.sign({ id: queryResult.data.rows[0].id, lastLogin: moment().toISOString() }, process.env.SERVER_KEY, { expiresIn: 86400 });
                        typeof (next) === 'function' ? next(200, { auth: true, token: token }) : console.error('In Models > Auth > verifyLogin, next() is not a function.');

                    } else {

                        // Password is invalid, return a null token with auth of false
                        typeof (next) === 'function' ? next(401, { auth: false, token: null }) : console.error('In Models > Auth > verifyLogin, next() is not a function.');

                    }

                } else {

                    // No user was found with that information, so we have to return 404
                    typeof (next) === 'function' ? next(new errs.NotFoundError('No user found')) : console.error('In Models > Auth > verifyLogin, next() is not a function.');

                }

            } else {

                // We did not get a 200 back fromt he query, so we need to return the error in a 500
                typeof (next) === 'function' ? next(new errs.InternalServerError(queryResult.message)) : console.error('In Models > Auth > verifyLogin, next() is not a function.');

            }
        });
    },
    /**
     *
     * @findByToken This function takes a data and next argument and returns the user information based on an id.
     *
    **/
    findByToken: function (token, next) {

        if (!token) {

            // If no token was provided, then we have to send back a 401
            return next(new errs.UnauthorizedError('No token provided.'));

        } else {

            // Validate the token using jwt.verify()
            jwt.verify(token, process.env.SERVER_KEY, function (e, decoded) {

                if (e) {
                    // If there is an error in verification, we return a 401
                    return next(new errs.UnauthorizedError('Failed to authenticate token.'));

                } else {
                    // Query the database based on the id passed
                    db.query('SELECT ID, EMAIL FROM AUTH WHERE ID=$1', [decoded.id], function (queryResult) {
                        if (queryResult.code === 200) {
                            // If successful, return the user object
                            var userObject = {
                                id: queryResult.data.rows[0].id,
                                email: queryResult.data.rows[0].email,
                                lastLogin: moment(decoded.lastLogin).toISOString()
                            };
                            typeof (next) === 'function' ? next(queryResult.code, userObject) : console.error('In Models > Auth > findById, next() is not a function.');

                        } else {
                            typeof (next) === 'function' ? next(queryResult.code, queryResult.message) : console.error('In Models > Auth > findById, next() is not a function.');
                        }
                    });
                }
            });

        }
        
    },
    /**
     *
     * @read This function takes a next argument and returns the decoded token in x-access-token if valid
     *
    **/
    read: function (token, next) {

        jwt.verify(token, process.env.SERVER_KEY, function (e, decoded) {

            if (e) {

                // If there is an error in verification, we return a 401
                return next(new errs.UnauthorizedError('Failed to authenticate token.'));

            } else {
                return next(200, decoded);
            }

        });
    }

}