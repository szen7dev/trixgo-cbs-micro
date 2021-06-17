"use strict";
const BaseModel                                 = require('../../../tools/db/base_model');
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.convensation-coll');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');

const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');


class Model extends BaseModel {

    constructor() {
        super(require('../database/chatting.conversation_department-coll'));
    }

    insert({  }){
        const that = this;
        return new Promise(async (resolve) => {
            try {

              
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListWithPage({ conversationID, currentPage, nextInfo, userID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
              

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model;
