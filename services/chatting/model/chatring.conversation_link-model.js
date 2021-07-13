"use strict";
const BaseModel                                 = require('../../../tools/db/base_model');
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.conversation-coll');
const CHATTING__CONVERSATION_LINK_COLL          = require('../database/chatting.conversation_link-coll');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');

const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');


class Model extends BaseModel {

    constructor() {
        super(require('../database/chatting.conversation_link-coll'));
    }

    insert({ conversationID, userID, link }){
        const that = this;
        return new Promise(async (resolve) => {
            try {

                console.log({conversationID, userID, link})
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Parameters validation error!', status : 422 });


                // Kiểm tra nếu tồn tại cuộc hội thoại
                let checkExistConversation =  await CHATTING__CONVERSATION_COLL.find({ 
                    members: { $all: [userID] }
                })

                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Permission denied', status : 403 });
                

                let infoConversationDraft = await CHATTING__CONVERSATION_LINK_COLL.findOne({ conversationID, link });
                if(infoConversationDraft)
                    return resolve({ error: false, message: "link exit", status : 200 });
            
                let infoConversationAfterInserted = await that.insertData({  conversation : conversationID, link  });
                
                if(!infoConversationAfterInserted)
                    return resolve({ error: true, message: "Can't insert link", status : 403 });
        
                return resolve({ error: false, data: infoConversationAfterInserted });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    getListWithPage({ conversationID, currentPage, nextInfo, userID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
                console.log({conversationID, currentPage, nextInfo, userID })
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Parameters validation error!', status : 422 });

                // Kiểm tra nếu tồn tại cuộc hội thoại
                let checkExistConversation =  await CHATTING__CONVERSATION_COLL.find({ 
                    _id     : conversationID,
                    members : { $all: [userID] }
                })
                if(!checkExistConversation || (checkExistConversation && !checkExistConversation[0]))
                    return resolve({ error: true, message: 'Permission denied', status : 403 });

                const page  = Number(currentPage) || 1;
                let perPage = 3;

                let _sort = {
                    creatAt: -1
                }
                let ObjectSearch            = {};

                let dataPaggingAndSort = await RANGE_BASE_PAGINATION({ nextInfo , keys: ['createAt__-1', '_id__-1'] })
                if(!dataPaggingAndSort || (dataPaggingAndSort && dataPaggingAndSort.error) )
                    return resolve({ error: true, message: 'Parameter nextInfo  validation error! ', status : 422 });

                _sort                               =  dataPaggingAndSort.data.sort
                ObjectSearch                        = dataPaggingAndSort.data.find;

                // ObjectSearch.conversation = conversationID;
                // console.log({ObjectSearch, 2 : ObjectSearch['$or'][1]._id, 3 : ObjectSearch['$or'][0]})

                let listConversation = await CHATTING__CONVERSATION_LINK_COLL.find(ObjectSearch)
                .sort(
                    _sort
                )
                .limit(perPage)

                return resolve({ error : false ,  data : listConversation, status : 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }
}
exports.MODEL = new Model;
