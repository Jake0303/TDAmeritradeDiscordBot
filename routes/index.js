'use strict';
var http = require('http');
var request = require('request');
var express = require('express');

var router = express.Router();
const redirect_uri = 'https://www.wetradehq.com/leaderboards';

/* 
Callback endpoint the TDA app uses.
To understand more about how the API authenticates, see this link.
https://developer.tdameritrade.com/content/simple-auth-local-apps
*/
router.get('/auth', function (req, res, next) {
    var authRequest = {
        url: 'https://api.tdameritrade.com/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'grant_type': 'authorization_code',
            'access_type': 'offline',
            'code': req.query.code, // get the code from url
            'client_id': process.env.CLIENT_ID + "@AMER.OAUTHAP", // this client id comes from config vars
            'redirect_uri': redirect_uri
        }
    };

    // make the post request
    request(authRequest, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // parse the tokens
            var authReply = JSON.parse(body);
            // to check it's correct, display it
            res.send(authReply);
        }
    });
});

module.exports = router;
