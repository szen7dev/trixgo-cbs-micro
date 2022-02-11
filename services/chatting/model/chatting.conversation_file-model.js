"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  = require('mongoose').Types.ObjectId;

/**
 * TOOLS
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
 */
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.conversation-coll');
const CHATTING__CONVERSATION_FILE_COLL          = require('../database/chatting.conversation_file-coll');

class Model extends BaseModel {

    constructor() {
        super(CHATTING__CONVERSATION_FILE_COLL);
    }

    insert({ conversationID, fileID }){
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([conversationID, fileID]))
					return resolve({ error: true, message: "Request Params Invalid", status: 400 });

                let infoMessageAfterInserted = await this.insertData({ conversation: conversationID, file: fileID });

				if(!infoMessageAfterInserted)
					return resolve({ error: true, message: "Can't create conversation file", status: 403 });

				return resolve({ error: false, data: infoMessageAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListWithPage({ conversationID, currentPage, nextInfo, userID }){
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
                    // .populate({path: 'usersSeen', select :  '_id fullname  image' })
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
