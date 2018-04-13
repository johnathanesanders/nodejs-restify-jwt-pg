const db = require('../db');

module.exports = {
    getAll: function (owner, next) {
        db.query('SELECT * FROM INGREDIENT WHERE OWNER=$1', [owner], function (queryResult) {
            if (queryResult.code === 200) {
                queryResult.data = queryResult.data.rows;
            }
            typeof (next) === 'function' ? next(queryResult.code, queryResult.data) : null;
            //res.status(queryResult.code).send(queryResult);
        });
    }
}