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
//Relay messages from Discord and post to them a forum ticker automatically if it contains ($)
client.on('message', function (message) {
    if (message.content === '/stop') {
        message.channel.send('TMCTD has stopped tracking your trades.');
        // update the details file object
        // TODO : Need to delete credentials associated with Discord account
        // right now only deleting latest creds
        details.pop();
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
                console.log(err);
            }
            console.log(`File uploaded successfully. ${data.Location}`);
        });
    }
    if (message.content === '/start') {
        message.channel.send('For TMCTD to start tracking your trades go to the following link : https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=https%3A%2F%2Fdiscordbottrades.herokuapp.com%2Fauth&client_id=P3FYOWCFDPAYMPS1UKGR2O0AVOCDRLGA%40AMER.OAUTHAP');
    }
});

//Models
const licenseKeyModel = require('../models/token');
const userModel = require('../models/user');
//userModel.createSchema(function (err, done) { });
//licenseKeyModel.createSchema(function (err, done) {});
//Login Discord Bot
const S3_BUCKET = process.env.S3_BUCKET_NAME;
aws.config.region = 'us-east-2';
const Days90 = 7776000; // 90 days in seconds
const Minutes30 = 1800 // 30 mins in seconds
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
var details = [];
// Uploading files to the bucket
s3.getObject(params, function (err, data) {
    if (err) {
        console.log(err);
    }
    try {
        details = JSON.parse(data.Body.toString());
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
                /* update the details file object
                details.push({ accesstoken: authReply.accesstoken, refreshtoken: authReply.refreshtoken });
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
                        console.log(err);
                    }
                    console.log(`File uploaded successfully. ${data.Location}`);
                });*/
                var newUser = {
                    accesstoken: authReply.access_token,
                    refreshtoken: authReply.refresh_token
                }
                console.log(newUser);
                userModel.create(newUser, function (err, done) {
                    res.send({ "success": "authorized" });
                });
            } else {
                res.send(authReply);
            }
        } catch (err) {
            console.log(err);
            res.send(authReply);
        }
    });

});


router.get('/licenseKey', function (req, res) {
    res.render('createLicenseKey');
});

router.post('/generateLicenseKey', function (req, res) {
    function makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result.toUpperCase();
    }
    var randKey = makeid(7);
    var licenseKey = {
        key: randKey
    };
    licenseKeyModel.create(licenseKey, function (err, insert) {
        res.send({ 'licenseKey': randKey});
    });
});

router.get('/', function (req, res) {
    userModel.get(function (err, users) {
        res.render('dashboard', users);
    });
});

router.get('/dashboard', function (req, res) {
    userModel.get(function (err, users) {
        res.render('dashboard', users);
    });
});

router.get('/update/:userid', function (req, res) {
    userModel.getById(req.params.userid, function (err, user) {
        res.render('update', { user: user });
    });
});

router.post('/update/:userid', function (req, res) {
    var user = {
        key: req.body.key,
        serverID: req.body.serverID,
        channelID: req.body.channelID
    };
    userModel.update(user, req.params.userid, function (err, done) {
        res.redirect('/dashboard');
    });
});

router.post('/delete/:userid', function (req, res) {
    userModel.delete(req.params.userid, function (err, done) {
        res.redirect('/dashboard');
    });
});

router.get('/reset', async function (req, res, next) {
    try {
        var result = await resetTokens();
    } catch (err) {
        console.log(err);
    }
});

var lastOrderId = [];
// Setting up S3 upload parameters
const orderparams = {
    Bucket: 'tdbot',
    Key: 'orders.json' // File name you want to save as in S3
};
// Uploading files to the bucket
s3.getObject(orderparams, function (err, data) {
    if (err) {
        console.log(err);
    }
    try {
        lastOrderId = JSON.parse(data.Body.toString());
    } catch (err) {
        console.log(err);
    }
});
//Get open positions
function getOrderUpdates() {
    console.log("Getting Order Updates");
    userModel.get(function (details) {
        for (var index in details) {
        var refreshtoken_req = {
            url: 'https://api.tdameritrade.com/v1/orders',
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + details[index].accesstoken
            }
        };
        //Make the request and get positions
            request(refreshtoken_req, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    try {
                        var orders = JSON.parse(body);
                        if (orders.length) {
                            for (var i = 0; i < orders.length; i++) {
                                try {
                                    var messageToDisplay = ''
                                    if (orders[i].status == 'FILLED') {
                                        if (orders[i].price == null || orders[i].price == undefined || orders[i].price == 'undefined')
                                            orders[i].price = 'MARKET';
                                        if (orders[i].orderLegCollection[0].instruction == 'BUY'
                                            || (orders[i].orderLegCollection != null && orders[i].orderLegCollection.length > 0 && orders[i].orderLegCollection[0].positionEffect == 'OPENING')) {
                                            orders[i].orderLegCollection[0].instruction = 'BOT';
                                            if (orders[i].orderLegCollection[0].orderLegType == 'EQUITY')
                                                messageToDisplay = "(SHARES) " + orders[i].orderLegCollection[0].instruction + " +" + orders[i].filledQuantity + " " + orders[i].orderLegCollection[0].instrument.symbol + " @ " + orders[i].price;
                                            else {
                                                console.log(orders[i].orderLegCollection[0].instrument);
                                                messageToDisplay = "(OPTIONS) " + orders[i].orderLegCollection[0].instruction + " +" + orders[i].filledQuantity + " " + orders[i].orderLegCollection[0].instrument.description + " @ " + orders[i].price;

                                            }
                                        }
                                        else {
                                            orders[i].orderLegCollection[0].instruction = 'SOLD';
                                            if (orders[i].orderLegCollection[0].orderLegType == 'EQUITY')
                                                messageToDisplay = "(SHARES) " + orders[i].orderLegCollection[0].instruction + " -" + orders[i].filledQuantity + " " + orders[i].orderLegCollection[0].instrument.symbol + " @ " + orders[i].price;
                                            else {
                                                console.log(orders[i].orderLegCollection[0]);
                                                messageToDisplay = "(OPTIONS) " + orders[i].orderLegCollection[0].instruction + " -" + orders[i].filledQuantity + " " + orders[i].orderLegCollection[0].instrument.description + " @ " + orders[i].price;
                                            }
                                        }
                                        if (!lastOrderId.includes(index.toString() + messageToDisplay + orders[i].enteredTime.toString() + orders[i].orderId.toString())) {
                                            //if (index == 0)
                                            client.channels.cache.get(details[index].channelID).send(messageToDisplay);
                                            //else if (index == 1)
                                            //  client.channels.cache.get('730906624226623531').send(messageToDisplay);
                                            //else
                                            //  client.channels.cache.get('730906609982898270').send(messageToDisplay);
                                            lastOrderId.push(index.toString() + messageToDisplay + orders[i].enteredTime.toString() + orders[i].orderId.toString());
                                            const s3 = new aws.S3({
                                                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                                                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                                                signatureVersion: 'v4',
                                                region: 'us-east-2'
                                            });
                                            // Setting up S3 upload parameters
                                            const uploadparams = {
                                                Bucket: S3_BUCKET,
                                                Key: 'orders.json', // File name you want to save as in S3
                                                Body: JSON.stringify(lastOrderId, null, 2)
                                            };

                                            // Uploading files to the bucket
                                            s3.upload(uploadparams, function (err, data) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                console.log(`File uploaded successfully. ${data.Location}`);
                                            });
                                        }
                                    }

                                } catch (err) {
                                    console.log(err);
                                }
                            }
                        }

                    } catch (err) {
                        console.log(err);
                    }
                } else {
                    console.log(JSON.parse(body));
                    resetAccessToken(details[index]);
                }
            });
        }
    });
}
setInterval(getOrderUpdates, 15000);

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
    details.accesstoken = jsonText.accesstoken;
    details.refreshtoken = jsonText.refreshtoken;
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


function resetAccessToken(user) {
    try {
        var refreshtoken_req = {
            url: 'https://api.tdameritrade.com/v1/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'grant_type': 'refreshtoken',
                'refreshtoken': user.refreshtoken,
                'client_id': process.env.CLIENT_ID
            }
        };

        request(refreshtoken_req, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('Successfully reset access token.');
                // get the TDA response
                var authReply = JSON.parse(body);
                //TODO : Successfully resets access token but next call for order updates does not work with new token even though it was granted
                console.log(authReply.accesstoken);
                user.accesstoken = authReply.accesstoken;
                user.accesslastupdate = Date().toString();

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
                        console.log(err);
                    }
                });
                userModel.update(user, user.userid, function (err, done) {

                });

            } else {
                console.log('Could not reset access token.');
                console.log(details[index].refreshtoken);
                console.log(process.env.CLIENT_ID);
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
