"use strict";
const BaseModel                                 = require('../../../tools/db/base_model');
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.convensation-coll');
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
                    return resolve({ error: true, message: 'invalid_object_id' });

                // Kiểm tra nếu tồn tại cuộc hội thoại
                let checkExistConversation =  await CHATTING__CONVERSATION_COLL.find({ 
                    members: { $all: [userID] }
                })

                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Forbidden_exit_members', status : 403 });
                

                let infoConversationDraft = await CHATTING__CONVERSATION_LINK_COLL.findOne({ conversationID, link });
                if(infoConversationDraft)
                    return resolve({ error : true, message : 'exited_conversation_link' })
            
                let infoConversationAfterInserted = await that.insertData({  conversation : conversationID, link  });
                
                if(!infoConversationAfterInserted)
                    return resolve({ error : true, message : 'cant_insert_conversation_link' })
        
                return resolve({ error: false, data: infoConversationAfterInserted });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListWithPage({ conversationID, currentPage, nextInfo, userID }){
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
                    return resolve({ error: true, message: 'Forbidden_is_not_members', status : 403 });

                const page  = Number(currentPage) || 1;
                let perPage = 3;

                let _sort = {
                    creatAt: -1
                }
                let ObjectSearch            = {};
                if(page!=1){
                    let dataPaggingAndSort = await RANGE_BASE_PAGINATION({ nextInfo , keys: ['createAt__-1', '_id__-1'] })
                    if(!dataPaggingAndSort || (dataPaggingAndSort && dataPaggingAndSort.error) )
                        return resolve({ error: true, message: 'invalid_object_id_paggin'});

                    _sort                               =  dataPaggingAndSort.data.sort
                    ObjectSearch                        = dataPaggingAndSort.data.find;
                }

                // ObjectSearch.conversation = conversationID;
                // console.log({ObjectSearch, 2 : ObjectSearch['$or'][1]._id})

                let listConversation = await CHATTING__CONVERSATION_LINK_COLL.find(ObjectSearch)
                .sort(
                    _sort
                )
                .limit(perPage)

                return resolve({ error : false ,  data : listConversation })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model;
