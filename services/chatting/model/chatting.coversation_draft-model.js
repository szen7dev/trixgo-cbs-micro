"use strict";
const BaseModel                                 = require('../../../tools/db/base_model');
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.conversation-coll');
const CHATTING__CONVERSATION_DRAFT_COLL         = require('../database/chatting.conversation_draft-coll');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');

const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');


class Model extends BaseModel {

    constructor() {
        super(require('../database/chatting.conversation_draft-coll'));
    }

    insertOrUpdate({ message, conversationID, userID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Parameters validation error!', status : 400 });

                // Kiểm tra nếu tồn tại cuộc hội thoại của hai người thì không tạo nữa
                let _checkExistConversation =  CHATTING__CONVERSATION_COLL.find({ 
                    members: { $all: [userID] }
                })
                let _checkExistConversationDraft =  CHATTING__CONVERSATION_DRAFT_COLL.findOne({ 
                    conversation : conversationID, user : userID 
                })

                let [ checkExistConversation, checkExistConversationDraft ] = await Promise.all([ _checkExistConversation, _checkExistConversationDraft])
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'You are not member', status : 403 });
                
                let infoConversationAfterInserted;
                let messageError = '';

                if(!checkExistConversationDraft){
                    messageError = "didn't create"
                    infoConversationAfterInserted = await that.insertData({ message, conversation : conversationID, user : userID  });
                }

                if(checkExistConversationDraft && checkExistConversationDraft._id){
                    messageError = "didn't update"
                    infoConversationAfterInserted = await CHATTING__CONVERSATION_DRAFT_COLL.findByIdAndUpdate(checkExistConversationDraft._id, { message })
                }
                
                if(!infoConversationAfterInserted)
                    return resolve({ error : true, message : messageError, status : 403 })

                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    getInfoByUserID({ conversationID, userID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
                console.log({ conversationID, userID })
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Parameters validation error!', status : 400 });

                // Kiểm tra nếu tồn tại cuộc hội thoại
                let checkExistConversation =  await CHATTING__CONVERSATION_COLL.find({ 
                    _id : conversationID,
                    members: { $all: [userID] }
                })

                if(!checkExistConversation || (checkExistConversation && !checkExistConversation[0]))
                    return resolve({ error: true, message: 'You are not member', status : 403 });

                let infoConversationDraft = await CHATTING__CONVERSATION_DRAFT_COLL.findOne({ conversation : conversationID, user: userID });

                return resolve({ error: false, data: infoConversationDraft,  status : 200  });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }
}
exports.MODEL = new Model;



// 400 : 'Parameters validation error!';
// 403 : 'Access Denied';
// 200 : 'success';
// 500 : 'server error'; //try catch