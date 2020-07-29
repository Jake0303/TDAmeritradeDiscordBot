'use strict';

var connection = require('../connection');
//TODO
exports.createSchema = function (done) {
    connection.get().query('DROP TABLE IF EXISTS licenseKey;DROP TABLE IF EXISTS users;CREATE TABLE `users` (`userid` int(11) NOT NULL AUTO_INCREMENT,`username` varchar(255) NOT NULL,`accesstoken` text NOT NULL,`refreshtoken` text NOT NULL,`accesslastupdate` text,`serverID` text,`channelID` text, PRIMARY KEY (`userid`),UNIQUE KEY `id_UNIQUE` (`userid`));', function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        } else console.log(result);
        
        done(result);
    });
};

exports.create = function (user, done) {
    connection.get().query('INSERT INTO `users` SET ?', user, function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result.insertId);
    });
};

exports.delete= function (userid, done) {
    connection.get().query('DELETE FROM `users` WHERE `userid` = ?', userid, function (error, result) {
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
    connection.get().query('SELECT * FROM `users` WHERE `userid` = ?', userid, function (error, result) {
        if (error) {
            console.log(error);
            return done(error, result);
        }

        done(null, result);
    });
};

exports.get = function (done) {
    connection.get().query('SELECT * FROM `users`', function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(result);
    });
};