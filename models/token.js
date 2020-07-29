'use strict';

var connection = require('../connection');

exports.createSchema = function (done) {
    connection.get().query('DROP TABLE IF EXISTS licenseKey;CREATE TABLE `licenseKey` (`tokenid` int(11) NOT NULL AUTO_INCREMENT,`key` varchar(255) NOT NULL,PRIMARY KEY (`tokenid`),UNIQUE KEY `id_UNIQUE` (`tokenid`))', function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        } else console.log(result);
        
        done(result);
    });
};

exports.create = function (token, done) {
    connection.get().query('INSERT INTO `licenseKey` SET ?', [token], function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result.insertId);
    });
};

exports.deleteById = function (token, done) {
    connection.get().query('DELETE FROM `licenseKey` WHERE `token` = ?', token, function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result.affectedRows);
    });
};

exports.deleteByIds = function (licenseKey, done) {
    connection.get().query('DELETE FROM `licenseKey` WHERE `token` IN (?)', [licenseKey], function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result.affectedRows);
    });
};

exports.getById = function (token, done) {
    connection.get().query('SELECT * FROM `licenseKey` WHERE `token` = ?', token, function (error, result) {
        if (error) {
            console.log(error);
            return done(error);
        }

        done(null, result);
    });
};