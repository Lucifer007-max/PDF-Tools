const tedious = require('tedious');
const { Sequelize } = require('sequelize');
const { dbName, dbConfig } = require('config.json');

module.exports = db = {};

initialize();

async function initialize() {
    const dialect = 'mysql';
    const host = dbConfig.server;
    const { userName, password } = dbConfig.authentication.options;

   

    // connect to db
    console.log('dbName',dbName);
    const sequelize = new Sequelize(dbName, userName, password, { host, dialect });

    // init models and add them to the exported db object
    db.users = require('../main/users/user.model')(sequelize);

    // sync all models with database
    // await sequelize.sync({ alter: false});
}
