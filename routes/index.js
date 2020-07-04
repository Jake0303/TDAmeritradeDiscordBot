'use strict';
var http = require('http');
var request = require('request');
var express = require('express');
const puppeteer = require('puppeteer');
var router = express.Router();
const redirect_uri = 'https://discordbottrades.herokuapp.com/auth';
const detailsFileName = '../details.json';
var details = require(detailsFileName);
const Days90 = 7776000; // 90 days in seconds
const Minutes30 = 1800 // 30 mins in seconds
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

router.get('/auth', async function (req, res, next) {
    try {
        var result = await resetTokens;
    } catch (err) {
        console.log(err);
    }
});

/*
Automatically fill in the login form to authenticate the TDA app
*/
async function resetTokens() {

    // Launch the browser
    const browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    // Go to the authentication page
    await page.goto('https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=' + encodeURIComponent(+'+https://discordbottrades.herokuapp.com/auth') + '&client_id=' + process.env.CLIENT_ID + '%40AMER.OAUTHAP');

    // Enter username
    await page.click('#username');
    await page.keyboard.type(process.env.USERNAME); // your trading account username

    // Enter password
    await page.click('#password');
    await page.keyboard.type(process.env.PASSWORD); // your trading account password

    // Click login button
    await page.click('#accept');

    // Click allow button
    await page.click('#accept');

    // get the tokens from the pre element
    var elem = await page.$("pre");
    var text = await page.evaluate(elem => elem.textContent, elem);

    // parse the response to a new object
    var jsonText = JSON.parse(text);
    console.log(jsonText);

    // update the details file object
    details.access_token = jsonText.access_token;
    details.refresh_token = jsonText.refresh_token;
    let time = Date().toString();
    details.access_last_update = time;
    details.refresh_last_update = time;

    // write the updated object to the details.json file
    fs.writeFile(detailsFileName, JSON.stringify(details, null, 2), function (err) {
        if (err) console.error(err);
    });

    // Close browser
    await browser.close();

    // return the text
    return text;

}


function resetAccessToken() {
    var refresh_token_req = {
        url: 'https://api.tdameritrade.com/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'grant_type': 'refresh_token',
            'refresh_token': details.refresh_token,
            'client_id': process.env.CLIENT_ID
        }
    };

    request(refresh_token_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // get the TDA response
            var authReply = JSON.parse(body);
            details.access_token = authReply.access_token;
            details.access_last_update = Date().toString();

            // write the updated object to the details.json file
            fs.writeFileSync(detailsFileName, JSON.stringify(details, null, 2), function (err) {
                if (err) console.error(err);
            });

        }
    });
}


/** 
 * returns true if the time difference is more than or equal to the maxDifference
 * maxDifference should be in seconds
*/
function compareTimeDifference(t1, t2, maxDifference) {
    var date1 = new Date(t1);
    var date2 = new Date(t2);
    var diff = Math.floor((date2 - date1) / 1000); // difference in seconds

    return (diff >= maxDifference);
}

/**
 * checks if the access/refresh are valid and if not then 
 * generate new tokens
*/
function validateTokens() {
    let time = Date().toString();
    // if the refresh token is expired, then reset both tokens
    if (compareTimeDifference(details.refresh_last_update, time, Days90)) {
        resetTokens();
        // if the access token is expired, then reset it
    } else if (compareTimeDifference(details.access_last_update, time, Minutes30)) {
        resetAccessToken();
    }
}

module.exports = router;
