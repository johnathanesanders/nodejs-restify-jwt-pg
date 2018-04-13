const { Pool } = require('pg');

const pool = new Pool();

module.exports = {
    create: function (content, params, next) {
        pool.connect()
            .then(client => {
                client.query('BEGIN')
                    .then(begin => {
                        client.query(content, params)
                            .then(res => {
                                client.query('COMMIT')
                                    .then(commit => {
                                        client.release();
                                        typeof next === 'function' ? next({ code: 200, message: 'OK', data: res }) : null;
                                    })
                                    .catch(e => {
                                        // May need to add a rollback here, if PostgreSQL acts like Oracle on disconnection prior to successful commit operation...todo
                                        client.release();
                                        console.error('An error occurred in the COMMIT operation. The following information might be helpful: ', e.message, e.stack);
                                        typeof next === 'function' ? next({ code: 500, message: 'An error occurred during the commit operation.' }) : null;
                                    });
                            })
                            .catch(e => {
                                client.query('ROLLBACK')
                                    .then(rollback => {
                                        client.release();
                                        console.error('An error occurred in the query operation, and a rollback operation was successfully performed. The following information might be helpful: ', e.message, e.stack);
                                        typeof next === 'function' ? next({ code: 500, message: 'An error occurred in the query operation, and a rollback operation was successfully performed.' }) : null;
                                    })
                                    .catch(e => {
                                        client.release();
                                        console.error('An error occurred in the query operation, and the rollback operation was unsuccessful. The following information might be helpful: ', e.message, e.stack);
                                        typeof next === 'function' ? next({ code: 500, message: 'An error occurred in the query operation, and the rollback operation was unsuccessful.' }) : null;
                                    });
                            });
                    })
                    .catch(e => {
                        client.release();
                        console.error('An error occurred in the BEGIN operation. The following information might be helpful: ', e.message, e.stack);
                        typeof next === 'function' ? next({ code: 500, message: 'An error occurred during query initialization (BEGIN) operation.' }) : null;
                    });
            })
            .catch(e => {
                client.release();
                console.error('An error occurred in the pool connection operation. The following information might be helpful: ', e.message, e.stack);
                typeof callback === 'function' ? callback({ code: 500, message: 'An error occurred in the pool connection operation.' }) : null;
            });
    },
    query: function (content, params, next) {
        pool.connect()
            .then(client => {
                client.query(content, params)
                    .then(res => {
                        client.release();
                        typeof next === 'function' ? next({ code: 200, message: 'OK', data: res }) : null;
                    })
                    .catch(e => {
                        //client.release();
                        console.error('An error occurred in the query operation. The following information might be helpful: ', e.message, e.stack);
                        typeof next === 'function' ? next({ code: 500, message: 'An error occurred in the query operation.' }) : null;
                    });
            })
            .catch(e => {
                client.release();
                console.error('An error occurred in the pool connection operation. The following information might be helpful: ', e.message, e.stack);
                typeof next === 'function' ? next({ code: 500, message: 'An error occurred in the pool connection operation.' }) : null;
            });
    }
}