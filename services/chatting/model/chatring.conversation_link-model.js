"use strict";

/**
 * BASE
 */
const BaseModel   								= require('../../../tools/db/base_model');

/**
 * TOOLS
 */
const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
 */
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.conversation-coll');
const CHATTING__CONVERSATION_LINK_COLL          = require('../database/chatting.conversation_link-coll');


class Model extends BaseModel {

    constructor() {
        super(CHATTING__CONVERSATION_LINK_COLL);
    }

    insert({ conversationID, userID, link }){
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

                let checkExistConversation =  await CHATTING__CONVERSATION_COLL.findOne({ 
					_id: conversationID,
                    members: { $all: [userID] }
                })

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

                let checkLinkExist = await CHATTING__CONVERSATION_LINK_COLL.findOne({ conversationID, link });
                if(checkLinkExist)
                    return resolve({ error: false, message: "Link is exist", status: 200 });

                let infoAfterInserted = await this.insertData({ conversation: conversationID, link });

                if(!infoAfterInserted)
                    return resolve({ error: true, message: "Can't create link", status: 403 });

                return resolve({ error: false, data: infoAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
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
