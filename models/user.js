'use strict';

var connection = require('../connection');
//TODO
exports.createSchema = function (done) {
    connection.get().query('DROP TABLE IF EXISTS licenseKey;DROP TABLE IF EXISTS users;CREATE TABLE `users` (`userid` int(11) NOT NULL AUTO_INCREMENT,`accesstoken` text NOT NULL,`refreshtoken` text NOT NULL,`accesslastupdate` text,`serverID` text,`channelID` text, PRIMARY KEY (`userid`),UNIQUE KEY `id_UNIQUE` (`userid`));', function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        } else console.log(result);

        done(result);
    });
};

exports.create = function (user, licenseKey, done) {
    connection.get().query('INSERT INTO `users` SET ?', user, function (error, result) {
        if (error) {
            console.log(error);
        }
        console.log(licenseKey);
        connection.get().query('UPDATE licenseKey SET userid = ? WHERE key = ?', [user.userid, licenseKey], function (error, result) {
            if (error) {
                console.log(error);
                return done(error);
            }

            return done(null, result.insertId);
        });
    });
};

exports.delete = function (userid, done) {
    connection.get().query('DELETE FROM licenseKey WHERE `userid` = ?;DELETE FROM `users` WHERE `userid` = ?', [userid,userid], function (error, result) {
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
    connection.get().query('SELECT * FROM `users` INNER JOIN licenseKey on users.userid = licenseKey.userid WHERE users.userid  = ?', userid, function (error, result) {
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
    connection.get().query('SELECT * FROM users INNER JOIN licenseKey on users.userid = licenseKey.userid;', function (error, result) {
        if (error) {
            console.log(error);
            return done(error, null);
        }
        return done(null, result);
    });
};