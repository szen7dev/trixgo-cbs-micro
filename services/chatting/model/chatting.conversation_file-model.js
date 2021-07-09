"use strict";
const BaseModel                                 = require('../../../tools/db/base_model');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.convensation-coll');
const CHATTING__CONVERSATION_FILE_COLL          = require('../database/chatting.conversation_file-coll');
const ObjectID                                  = require('mongoose').Types.ObjectId;


const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');


class Model extends BaseModel {

    constructor() {
        super(require('../database/chatting.conversation_file-coll'));
    }

    insert({  conversationID, fileID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {

                infoMessageAfterInserted = await that.insertData({ conversationID, fileID });

                return resolve({ error: false, message: 'Cant create message ', status : 403 });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListWithPage({ conversationID, currentPage, nextInfo, userID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
                const page = Number(currentPage) || 1;
                const perPage = 15;
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
                    _id: conversationID ,
                    members: { $all: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Permission denied', status : 403 });
                
                
               let dataPaggingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys: ['createAt__-1', '_id__-1'] })
               
                if(!dataPaggingAndSort || (dataPaggingAndSort && dataPaggingAndSort.error) )
                    return resolve({ error: true, message: 'request params nextInfo invalid', status : 400 });

                let ObjectSearch            = dataPaggingAndSort.data.find;
                ObjectSearch.conversation   =  ObjectID(conversationID);
                let _sort = dataPaggingAndSort.data.sort;
                let listMessage             = await CHATTING__CONVERSATION_FILE_COLL.find(ObjectSearch)
                .populate({
                    path : 'file', model: CHATTING__CONVERSATION_FILE_COLL
                })
                // .populate(
                // {
                //     path : 'sender', select :'_id fullname image company ' 
                // })
                // .populate({
                //     path: 'parent',
                //     populate: {
                //         path: "files sender",
                //         select :'_id fullname image company path name type size author conversation' 
                //     }
                // })
                // .populate(
                // {
                //     path : 'likedUsers', select :'_id fullname image company ' 
                // })
                // .populate({path : 'listSeen', select :  '_id fullname  image' })
                // .populate({
                //     path: 'reactions',
                //     populate: {
                //         path: "author",
                //         select :'_id fullname image company' 
                //     }
                // })
                .limit(perPage)
                .sort( dataPaggingAndSort.data.sort );

            
            return resolve({ error: false, data : listMessage, page, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model;
