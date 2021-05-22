"use strict";

const _                             = require("lodash");
const Redis                         = require("ioredis");
const jwt                           = require('jsonwebtoken');
const cfJwt                         = require('../../tools/jwt/cf_jwt');
// const ACCOUNT_COLL                  = require('../../database/test/account_coll')

const checkAuthencation = async (req, res, next) => {
    try {
        let token = req.headers[ 'x-access-token' ] || req.headers.token || null;
        if(token){
            jwt.verify(token, cfJwt.secret, async (err, decoded) => {
                if (err) {
                    return next(new Error(err))
                    // res.redirect('/');
                } else {
                    const { infoUser } = decoded;
                    req.user = infoUser;
                    req.token = token;
                    return next();
                }
            });
        }
        else{
            return next(new Error('redirect_url_clear_session'))
        }
    } catch (error) {
        return next(new Error(error))
    }
}

const checkAuthorization = async (req, res, next) => {
    try {
        let token = req.headers[ 'x-access-token' ] || req.headers.token || null;
        if(token){
            jwt.verify(token, cfJwt.secret, async (err, decoded) => {
                if (err) {
                    return next(new Error(err))
                    // res.redirect('/');
                } else {
                    const { infoUser } = decoded;
                    let infoUserDB = await ACCOUNT_COLL.findOne({_id: infoUser._id});

                    // User không có quyền
                    if(infoUser.role == 0){
                        return next(new Error('account_is_not_authorized'));
                    }
                    req.user = infoUserDB;
                    req.token = token;
                    // req.APP_ID = await getAppIDByURLRequest(req.originalUrl);
                    let slug = req.originalUrl.split('/') && Array.isArray(req.originalUrl.split('/')) && req.originalUrl.split('/')[2];

                    // role = 1 (Admin) có quyền vào tất cả các app
                    if(infoUser.role != 1){
                        let checkUserValidAccessAppTemp = await checkUserValidAccessApp(req, res, next);
                        if(checkUserValidAccessAppTemp.error){
                            return next(new Error(checkUserValidAccessAppTemp.message))
                        }
                    }
                   
                    return next();
                }
            });
        }
        else{
            return next(new Error('redirect_url_clear_session'))
        }
    } catch (error) {
        return next(new Error(error))
    }
}

const checkAuthorizationAdmin = async (req, res, next) => {
    try {
        let token = req.headers[ 'x-access-token' ] || req.headers.token || null;
        if(token){
            jwt.verify(token, cfJwt.secret, async (err, decoded) => {
                if (err) {
                    return next(new Error(err))
                    // res.redirect('/');
                } else {
                    const { infoUser } = decoded;
                    let infoUserDB = await ACCOUNT_COLL.findOne({_id: infoUser._id});
                    // Không phải quyền admin
                    if(infoUser.role != 1){
                        return next(new Error('account_not_admin_account'));
                    }
                    req.user = infoUserDB;
                    req.token = token;
                    return next();
                }
            });
        }
        else{
            return next(new Error('redirect_url_clear_session'))
        }
    } catch (error) {
        return next(new Error(error))
    }
}



exports.CHECK_AUTHENCATION              = checkAuthencation;
exports.CHECK_AUTHORIZATION             = checkAuthorization;
exports.CHECK_AUTHORIZATION_ADMIN       = checkAuthorizationAdmin;
