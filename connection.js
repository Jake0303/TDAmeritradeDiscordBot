'use strict';
var mysql = require('mysql');
require('dotenv').config();
var password = '';
if (process.env.DEV)
    password = "e4c09d9f"
else
    password = "e4c09d9f";
var con = mysql.createConnection({
    host: "us-cdbr-east-02.cleardb.com",
    user: "b59f13daa97ce8",
    password: password,
    database: "heroku_0f38e98eb4e01b0",
    multipleStatements: true,
    charset: 'utf8mb4'
});

exports.get = function () {
    return con;
};
