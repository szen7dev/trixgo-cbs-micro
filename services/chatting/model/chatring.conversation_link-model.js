"use strict";

/**
 * BASE
 */
const BaseModel   								= require('../../../tools/db/base_model');

/**
 * TOOLS
 */
const { checkObjectIDs }                        = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const CHATTING__CONVERSATION_LINK_COLL          = require('../database/chatting.conversation_link-coll');

class Model extends BaseModel {

    constructor() {
        super(CHATTING__CONVERSATION_LINK_COLL);
    }

    insert({ conversationID, link, authorID }){
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([conversationID, authorID]))
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

                // let checkLinkExist = await CHATTING__CONVERSATION_LINK_COLL.findOne({ conversationID, link, authorID });
                // if(checkLinkExist)
                //     return resolve({ error: false, message: "Link is exist", status: 200 });

                let infoAfterInserted = await this.insertData({ conversation: conversationID, author: authorID, link });

                if(!infoAfterInserted)
                    return resolve({ error: true, message: "Can't create link", status: 403 });

                return resolve({ error: false, data: infoAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}
exports.MODEL = new Model;
