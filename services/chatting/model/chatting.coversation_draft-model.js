"use strict";
const BaseModel                                 = require('../../../tools/db/base_model');
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.convensation-coll');
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
                console.log({message, conversationID, userID})
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'invalid_object_id' });

                // Kiểm tra nếu tồn tại cuộc hội thoại của hai người thì không tạo nữa
                let _checkExistConversation =  CHATTING__CONVERSATION_COLL.find({ 
                    members: { $all: [userID] }
                })
                let _checkExistConversationDraft =  CHATTING__CONVERSATION_DRAFT_COLL.findOne({ 
                    conversation : conversationID, user : userID 
                })

                let [ checkExistConversation, checkExistConversationDraft ] = await Promise.all([ _checkExistConversation, _checkExistConversationDraft])
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Forbidden_exit_members', status : 403 });
                
                let infoConversationAfterInserted;
                let messageError = '';

                if(!checkExistConversationDraft){
                    messageError = 'cant_insert'
                    infoConversationAfterInserted = await that.insertData({ message, conversation : conversationID, user : userID  });
                }

                if(checkExistConversationDraft && checkExistConversationDraft._id){
                    messageError = 'cant_update'
                    infoConversationAfterInserted = await CHATTING__CONVERSATION_DRAFT_COLL.findByIdAndUpdate(checkExistConversationDraft._id, { message })
                }
                
                if(!infoConversationAfterInserted)
                    return resolve({ error : true, message : messageError })

                return resolve({ error: false, data: infoConversationAfterUpdated });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfoByUserID({ conversationID, userID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'invalid_object_id' });

                // Kiểm tra nếu tồn tại cuộc hội thoại
                let checkExistConversation =  await CHATTING__CONVERSATION_COLL.find({ 
                    members: { $all: [userID] }
                })

                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Forbidden_exit_members', status : 403 });

                let infoConversationDraft = await CHATTING__CONVERSATION_DRAFT_COLL.findOne({ conversation : conversationID, user: userID });
                if(!infoConversationDraft)
                    return resolve({ error : true, message : 'have_not_been_draft' })

                return resolve({ error: false, data: infoConversationDraft });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model;
