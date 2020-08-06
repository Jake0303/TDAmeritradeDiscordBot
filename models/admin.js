'use strict';

var connection = require('../connection');


exports.create = function (user, done) {
    connection.get().query('INSERT INTO `admins` SET ?', user, function (error, result) {
        if (error) {
            console.log(error);
        }
        return done(null, result);
    });
};

exports.delete = function (userid, done) {
    connection.get().query('DELETE FROM licenseKey WHERE `userid` = ?;DELETE FROM `users` WHERE `userid` = ?', [userid, userid], function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result.affectedRows);
    });
};

exports.deleteByIds = function (users, done) {
    connection.get().query('DELETE FROM `users` WHERE `token` IN (?)', [users], function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result.affectedRows);
    });
};

exports.update = function (user, userid, done) {
    connection.get().query('UPDATE users SET ? WHERE userid = ?', [user, userid], function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result);
    });
};

exports.getById = function (userid, done) {
    connection.get().query('SELECT * FROM `users` WHERE users.userid  = ?', userid, function (error, result) {
        if (error) {
            console.log(error);
            return done(error, null);
        }
        if (result && result.length)
            return done(null, result[0]);
        else return done(null, null);
    });
};

exports.get = function (done) {
    connection.get().query('SELECT * FROM users', function (error, result) {
        if (error) {
            console.log(error);
            return done(error, null);
        }
        return done(null, result);
    });
};