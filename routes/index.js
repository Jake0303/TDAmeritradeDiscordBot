'use strict';
var http = require('http');
var request = require('request');
var express = require('express');
const aws = require('aws-sdk');
const puppeteer = require('puppeteer');
var router = express.Router();
var fs = require('fs');
const redirect_uri = encodeURIComponent('https://discordbottrades.herokuapp.com');
const mainChannelID = '730906578789859338';
const detailsFileName = '../details.json';
require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
//On Discord Error
client.on('error', err => {
    console.log(err);
});
exports.client = client;
//Kick cancelled students
client.on('ready', () => {
    exports.client = client;
});
client.login(process.env.DISCORDTOKEN);
//Login Discord Bot
const S3_BUCKET = process.env.S3_BUCKET_NAME;
aws.config.region = 'us-east-2';
const Days90 = 7776000; // 90 days in seconds
const Minutes30 = 1800 // 30 mins in seconds

console.log(process.env.AWS_ACCESS_KEY_ID);
console.log(process.env.AWS_SECRET_ACCESS_KEY);
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    signatureVersion: 'v4'
});
// Setting up S3 upload parameters
const params = {
    Bucket: 'tdbot',
    Key: 'details.json' // File name you want to save as in S3
};
var details = {};
// Uploading files to the bucket
s3.getObject(params, function (err, data) {
    if (err) {
        console.log(err);
    }
    try {
        details = JSON.parse(data.Body.toString());
        console.log(details);
    } catch (err) {
        console.log(err);
    }
});

/* 
Callback endpoint the TDA app uses.
To understand more about how the API authenticates, see this link.
https://developer.tdameritrade.com/content/simple-auth-local-apps
*/
router.get('/auth', function (req, res, next) {
    console.log(process.env.CLIENT_ID + "@AMER.OAUTHAP");
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
            'redirect_uri': 'https://discordbottrades.herokuapp.com/auth'
        }
    };

    // make the post request
    request(authRequest, function (error, response, body) {
        try {
            // parse the tokens
            var authReply = JSON.parse(body);
            if (!error && response.statusCode == 200) {
                // update the details file object
                details.access_token = authReply.access_token;
                details.refresh_token = authReply.refresh_token;
                console.log(details);
                const s3 = new aws.S3({
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    signatureVersion: 'v4',
                    region: 'us-east-2'
                });
                // Setting up S3 upload parameters
                const params = {
                    Bucket: S3_BUCKET,
                    Key: 'details.json', // File name you want to save as in S3
                    Body: JSON.stringify(details, null, 2)
                };

                // Uploading files to the bucket
                s3.upload(params, function (err, data) {
                    if (err) {
                        throw err;
                    }
                    console.log(`File uploaded successfully. ${data.Location}`);
                });
                res.send({ "success": "authorized" });
            } else {
                console.log(body);
                res.send(authReply);
            }
        } catch (err) {
            console.log(err);
            res.send({ "error": err });
        }
    });

});


router.get('/', function (req, res) {
    console.log(details);
    var refresh_token_req = {
        url: 'https://api.tdameritrade.com/v1/orders',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + details.access_token
        }
    };
    //Make the request and get positions
    request(refresh_token_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                console.log(body);
                console.log(details);
                res.send(details);
                if (lastOrderId == 0 || lastOrderId != testPosition.orderId) {
                    var messageToDisplay = testPosition.orderType + " order filled with a quantity of : " + testPosition.orderType + " at price : " + testPosition.price + " for symbol : " + testPosition.orderLegCollection[0].instrument.symbol;
                    client.channels.get(mainChannelID).send(messageToDisplay);
                    lastOrderId = testPosition.orderId;
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            res.send(JSON.parse(body));

        }
    });
});

router.get('/reset', async function (req, res, next) {
    try {
        var result = await resetTokens();
    } catch (err) {
        console.log(err);
    }
});

var lastOrderId = 0;
//Get open positions
function getOrderUpdates() {
    console.log("Getting Order Updates");
    var refresh_token_req = {
        url: 'https://api.tdameritrade.com/v1/orders',
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + details.access_token
        }
    };
    //Make the request and get positions
    request(refresh_token_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var orders = JSON.parse(body);
                console.log(orders);
                if (lastOrderId == 0 || lastOrderId != orders.orderId) {
                    var messageToDisplay = orders.orderType + " order filled with a quantity of : " + orders.orderType + " at price : " + orders.price + " for symbol : " + orders.orderLegCollection[0].instrument.symbol;
                    client.channels.get(mainChannelID).send(messageToDisplay);
                    lastOrderId = orders.orderId;
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            console.log(JSON.parse(body));
            resetAccessToken();
        }
    });
}
setInterval(getOrderUpdates, 600);

/*
Automatically fill in the login form to authenticate the TDA app
*/
async function resetTokens() {
    console.log('here');
    // Launch the browser
    const browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    // Go to the authentication page
    await page.goto('https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=' + encodeURIComponent(+'+https://discordbottrades.herokuapp.com/auth') + '&client_id=' + process.env.CLIENT_ID + '%40AMER.OAUTHAP');

    // Enter username
    await page.click('#username');
    await page.keyboard.type(process.env.USER); // your trading account username

    // Enter password
    await page.click('#password');
    await page.keyboard.type(process.env.PASS); // your trading account password
    await page.click('#rememberuserid');
    // Click login button
    await page.click('#accept');
    console.log('here');
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
    try {
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

                const s3 = new aws.S3({
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    signatureVersion: 'v4',
                    region: 'us-east-2'
                });
                // Setting up S3 upload parameters
                const params = {
                    Bucket: S3_BUCKET,
                    Key: 'details.json', // File name you want to save as in S3
                    Body: JSON.stringify(details, null, 2)
                };

                // Uploading files to the bucket
                s3.upload(params, function (err, data) {
                    if (err) {
                        throw err;
                    }
                    console.log(`File uploaded successfully. ${data.Location}`);
                });

            } else {
                console.log(JSON.parse(body));
            }
        });
    } catch (err) {
        console.log(err);
    }
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
