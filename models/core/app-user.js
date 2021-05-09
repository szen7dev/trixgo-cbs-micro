"use strict";
const ObjectID                  = require('mongoose').Types.ObjectId;
const BaseModel                 = require('../intalize/base_model');
const APP_USER_COLL             = require('../../database/test/app_user_coll');

class Model extends BaseModel {

    constructor() {
        super(require('../../database/test/app_user_coll'))
    }
    checkExistRecord({ appID, userID }) {
        return new Promise(async resolve => {
            try {
                let infoRecord = await APP_USER_COLL.findOne({
                    app: appID, account: userID
                });
                if (!infoRecord)
                    return resolve({ error: true, message: 'user_have_not_access_app' });
                return resolve({ error: false,  message: 'user_access_app', data: infoRecord });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    

}

exports.MODEL = new Model;