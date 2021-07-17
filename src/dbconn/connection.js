const Sequelize = require("sequelize");
const APPCONSTANTS = require("../../app.constants");

const config = {
    username: APPCONSTANTS.DBUSER,
    database: APPCONSTANTS.DATABASE,
    host: APPCONSTANTS.DBHOST,
    dialect: APPCONSTANTS.DIALECT,
    password: APPCONSTANTS.DBPASSWORD,
    port: APPCONSTANTS.DBPORT

};
/*
const config = {
    "username": "sonetinfolabs@sonetinfolabs-mysql-dev",
    "password": "sonetinfolabsdeveloper1",
    "database": "iy_channel",
    "host": "sonetinfolabs-mysql-dev.mysql.database.azure.com",
    "dialect": "mysql",
    port: 3306
};*/

const sequelize = new Sequelize(config);
module.exports = sequelize;
global.sequelize = sequelize;