"use strict";

const _ = require("lodash");
const { MoleculerClientError }      = require("moleculer").Errors;
const Redis                         = require("ioredis");
const redis                         = new Redis();
const jwt                           = require('jsonwebtoken');
const cfJwt                         = require('../../config/cf_jws');
const ACCOUNT_COLL                  = require('../../database/test/account_coll')
const { getAppIDByURLRequest }      = require('../../utils/utils');
const APP_USER_MODEL                = require('../../models/core/app-user').MODEL
 /**
 * Kiểm tra quyền truy cập ứng dụng
 * 1. User của công ty được cấp phép truy cập app (AppUser)
 */
const checkUserValidAccessApp = async (req, res, next) => {
    try {
        let { _id: userID } = req.user;
        let { APP_ID: appID } = req;
        // console.log({________________checkUserValidAccessApp:appID})
        /**
         * CHECK COMPANY VALID
         */
        if(!appID){
            return next(new Error('something wrong'))
        }
        // let signalCompanyValidAccessApp = await APP_COMPANY_MODEL.checkValidAppCompanyAtCurrent({ appID, companyID });
        // // console.log(signalCompanyValidAccessApp)
        // if (signalCompanyValidAccessApp.error)
        //     return res.json(signalCompanyValidAccessApp);

        /**
         * CHECK USER VALID
         */
        let signalUserValidAccessApp = await APP_USER_MODEL.checkExistRecord({ userID, appID });
        
        return signalUserValidAccessApp;
    } catch (error) {
        console.log({error});
        return next(new Error(error));
    }
    
}
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
                    req.APP_ID = await getAppIDByURLRequest(req.originalUrl);
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
exports.CHECK_USER_VALID_ACCESS_APP     = checkUserValidAccessApp;
exports.CHECK_AUTHORIZATION_ADMIN       = checkAuthorizationAdmin;
