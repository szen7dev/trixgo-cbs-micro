"use strict";

const _session_version  = '1.1.0';
const _session_key      = process.env.SESSION_SECRET_KEY || '!^$&!^$!*$&@$^@&$#$^%&*&*____trixgo_micro____';
const session           = require('express-session');
let app                 = require('express')();
// const redis = require("redis");
const redisStore        = require('connect-redis')(session);
const { CLIENT_REDIS }  = require('./cf_redis');

exports.sessionConf = function () {
    let ses = session({
        secret: _session_key,
        store: new redisStore({
            // host: 'localhost', port: 6379, client: client, ttl: 10 * 24 * 60 * 60,
            client: CLIENT_REDIS
        }),
        saveUninitialized: false,
        resave: false
    });

    // let ses = session({
    //     resave: false, 
    //     saveUninitialized: false, 
    //     secret: 'somesecret', 
    //     cookie: { maxAge: 10 * 24 * 60 * 60 } 
    // });
    app.set("trust proxy", 1);
    app.use(ses);

    return ses;
};

/**
 * @return {string}
 */
exports.getSessionKey = function GetSessionKey(mainKey) {
    return mainKey + '_' + _session_key + '_' + _session_version;
};