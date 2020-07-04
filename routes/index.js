'use strict';
var http = require('http');
var request = require('request');
var express = require('express');
const puppeteer = require('puppeteer');
var router = express.Router();
const redirect_uri = 'https://discordbottrades.herokuapp.com/auth';
const mainChannelID = 'MAIN DISCORD SERVER ID';
const detailsFileName = '../details.json';
const Discord = require('discord.js');
const client = new Discord.Client();
require('dotenv').config()
//Login Discord Bot
client.login(process.env.DISCORDTOKEN);

//On Discord Error
client.on('error', err => {
    console.log(err);
});
exports.client = client;
//Kick cancelled students
client.on('ready', () => {
    exports.client = client;
});
var details = require(detailsFileName);
const Days90 = 7776000; // 90 days in seconds
const Minutes30 = 1800 // 30 mins in seconds
var testPosition = [
    //OrderGet:
    {
        "session": "'NORMAL' or 'AM' or 'PM' or 'SEAMLESS'",
        "duration": "'DAY' or 'GOOD_TILL_CANCEL' or 'FILL_OR_KILL'",
        "orderType": "'MARKET' or 'LIMIT' or 'STOP' or 'STOP_LIMIT' or 'TRAILING_STOP' or 'MARKET_ON_CLOSE' or 'EXERCISE' or 'TRAILING_STOP_LIMIT' or 'NET_DEBIT' or 'NET_CREDIT' or 'NET_ZERO'",
        "cancelTime": {
            "date": "string",
            "shortFormat": false
        },
        "complexOrderStrategyType": "'NONE' or 'COVERED' or 'VERTICAL' or 'BACK_RATIO' or 'CALENDAR' or 'DIAGONAL' or 'STRADDLE' or 'STRANGLE' or 'COLLAR_SYNTHETIC' or 'BUTTERFLY' or 'CONDOR' or 'IRON_CONDOR' or 'VERTICAL_ROLL' or 'COLLAR_WITH_STOCK' or 'DOUBLE_DIAGONAL' or 'UNBALANCED_BUTTERFLY' or 'UNBALANCED_CONDOR' or 'UNBALANCED_IRON_CONDOR' or 'UNBALANCED_VERTICAL_ROLL' or 'CUSTOM'",
        "quantity": 0,
        "filledQuantity": 0,
        "remainingQuantity": 0,
        "requestedDestination": "'INET' or 'ECN_ARCA' or 'CBOE' or 'AMEX' or 'PHLX' or 'ISE' or 'BOX' or 'NYSE' or 'NASDAQ' or 'BATS' or 'C2' or 'AUTO'",
        "destinationLinkName": "string",
        "releaseTime": "string",
        "stopPrice": 0,
        "stopPriceLinkBasis": "'MANUAL' or 'BASE' or 'TRIGGER' or 'LAST' or 'BID' or 'ASK' or 'ASK_BID' or 'MARK' or 'AVERAGE'",
        "stopPriceLinkType": "'VALUE' or 'PERCENT' or 'TICK'",
        "stopPriceOffset": 0,
        "stopType": "'STANDARD' or 'BID' or 'ASK' or 'LAST' or 'MARK'",
        "priceLinkBasis": "'MANUAL' or 'BASE' or 'TRIGGER' or 'LAST' or 'BID' or 'ASK' or 'ASK_BID' or 'MARK' or 'AVERAGE'",
        "priceLinkType": "'VALUE' or 'PERCENT' or 'TICK'",
        "price": 0,
        "taxLotMethod": "'FIFO' or 'LIFO' or 'HIGH_COST' or 'LOW_COST' or 'AVERAGE_COST' or 'SPECIFIC_LOT'",
        "orderLegCollection": [
            {
                "orderLegType": "'EQUITY' or 'OPTION' or 'INDEX' or 'MUTUAL_FUND' or 'CASH_EQUIVALENT' or 'FIXED_INCOME' or 'CURRENCY'",
                "legId": 0,
                "instrument": "The type <Instrument> has the following subclasses [Equity, FixedIncome, MutualFund, CashEquivalent, Option] descriptions are listed below\"",
                "instruction": "'BUY' or 'SELL' or 'BUY_TO_COVER' or 'SELL_SHORT' or 'BUY_TO_OPEN' or 'BUY_TO_CLOSE' or 'SELL_TO_OPEN' or 'SELL_TO_CLOSE' or 'EXCHANGE'",
                "positionEffect": "'OPENING' or 'CLOSING' or 'AUTOMATIC'",
                "quantity": 0,
                "quantityType": "'ALL_SHARES' or 'DOLLARS' or 'SHARES'"
            }
        ],
        "activationPrice": 0,
        "specialInstruction": "'ALL_OR_NONE' or 'DO_NOT_REDUCE' or 'ALL_OR_NONE_DO_NOT_REDUCE'",
        "orderStrategyType": "'SINGLE' or 'OCO' or 'TRIGGER'",
        "orderId": 0,
        "cancelable": false,
        "editable": false,
        "status": "'AWAITING_PARENT_ORDER' or 'AWAITING_CONDITION' or 'AWAITING_MANUAL_REVIEW' or 'ACCEPTED' or 'AWAITING_UR_OUT' or 'PENDING_ACTIVATION' or 'QUEUED' or 'WORKING' or 'REJECTED' or 'PENDING_CANCEL' or 'CANCELED' or 'PENDING_REPLACE' or 'REPLACED' or 'FILLED' or 'EXPIRED'",
        "enteredTime": "string",
        "closeTime": "string",
        "tag": "string",
        "accountId": 0,
        "orderActivityCollection": [
            "The type <OrderActivity> has the following subclasses [Execution] descriptions are listed below"
        ],
        "replacingOrderCollection": [
            {}
        ],
        "childOrderStrategies": [
            {}
        ],
        "statusDescription": "string"
    }
]

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
            res.send(authReply);
        }
    });
});


router.get('/', function (req, res) {
    validateTokens();
    res.render('index');
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
    var refresh_token_req = {
        url: 'https://api.tdameritrade.com/v1/orders',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + details.access_token
        }
    };
    //Make the request and get positions
    request(refresh_token_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                console.log(body);
                if (lastOrderId == 0 || lastOrderId != testPosition.orderId) {
                    var messageToDisplay = testPosition.orderType + " order filled with a quantity of : " + testPosition.orderType + " at price : " + testPosition.price + " for symbol : " + testPosition.orderLegCollection[0].instrument.symbol;
                    client.channels.get(mainChannelID).send(messageToDisplay);
                    lastOrderId = testPosition.orderId;
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            console.log(error);
            console.log(response);
        }
    });
}
setInterval(getOrderUpdates, 120000);

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
