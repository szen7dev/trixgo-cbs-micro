"use strict";

/**
 * EXTERNAL
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, IsJsonString }				= require('../../../tools/utils/utils');
const { CF_ACTIONS_REACTION } 						= require('../../reaction/helper/reaction.actions-constant');
const { REACTION_TYPES }							= require('../helper/chatting.keys-constant');

/**
 * COLLECTIONS, MODELS
 */
const CHATTING__MESSAGE_COLL				        = require('../database/chatting.message-coll');
const CHATTING__MESSAGE_REACTION_COLL				= require('../database/chatting.message_reaction-coll');

class Model extends BaseModel {

    constructor() {
        super(CHATTING__MESSAGE_REACTION_COLL);
    }

	/**
	 * Dev: MinhVH
	 * Func: Reaction tin nhắn trong cuộc hội thoại
	 * Date: 26/10/2021
	 */
    reactionMessage({ userID, messageID, typeReaction }){
		return new Promise(async resolve => {
			try {
				if(!typeReaction || !REACTION_TYPES.includes(typeReaction)) {
                    return resolve({
						error: true, 
						message: 'Request params type reaction invalid', 
						keyError: 'params_typeReaction_invalid',
						status: 400
					});
				}

				if(!checkObjectIDs([userID, messageID])) {
                    return resolve({
						error: true, 
						message: 'Request params messageID or userID invalid', 
						keyError: 'params_messageID_or_userID_invalid',
						status: 400
					});
				}

				// Check reaction is exists
				const infoReaction = await CHATTING__MESSAGE_REACTION_COLL
					.findOne({
						message: messageID,
						author: userID
					})
					.lean();

				if(infoReaction) {
					await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
						$pull: {
							reactions: infoReaction._id
						}
					}, { new: true });
				}

				if(infoReaction && infoReaction.type === typeReaction){
					const infoAfterDelete = await CHATTING__MESSAGE_REACTION_COLL.findByIdAndDelete(infoReaction._id);

					return resolve({
						error: false,
						status: 200,
						message: infoAfterDelete
					});
				}

				const infoReactionAfterInsert = await this.insertData({
					type: typeReaction,
					message: messageID,
					author: userID
				});

				if(!infoReactionAfterInsert) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					});
				}

				await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
					$addToSet: {
						reactions: infoReactionAfterInsert._id
					}
				}, { new: true });

                return resolve({ error: false, data: infoReactionAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

    /**
	 * Dev: MinhVH
	 * Func: Danh sách reaction của tin nhắn
	 * Date: 02/09/2021
	 */
	getListReactionMessage({ messageID, userID }) {
		return new Promise(async (resolve) => {
			try {
				if(!checkObjectIDs([userID, messageID])) {
                    return resolve({
						error: true, 
						message: 'Tham số messageID hoặc userID không hợp lệ', 
						keyError: 'params_messageID_or_userID_invalid',
						status: 400
					});
				}

				let infoMessage = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate({
						path: 'reactions',
						select: '_id type',
						populate: {
							path: 'userCreate',
							select: '_id fullname iamge'
						}
					})
					.lean();

				if(!infoMessage) {
					return resolve({
						error: true,
						message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
						keyError: 'error_occurred',
						status: 422
					})
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: infoMessage.reactions,
						totalRecord: infoMessage.reactions?.length,
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Danh sách reaction của tin nhắn
	 * Date: 02/09/2021
	 */
	// getList({ conversationID, lastestID, limit = 10, select, populates, authorID }){
	// 	return new Promise(async resolve => {
	// 		try {
	// 			let conditionObj = { conversation: conversationID, type: 8 };
    //             let sortBy = { createAt: -1 };
    //             let keys = ['createAt__-1', '_id__-1'];

	// 			if(!checkObjectIDs([authorID])) {
	// 				return resolve({
	// 					error: true,
	// 					message: "Tham số authorID không hợp lệ",
	// 					keyError: "params_authorID_invalid",
	// 					status: 400,
	// 				})
	// 			}

	// 			if(!checkObjectIDs([conversationID])) {
	// 				return resolve({
	// 					error: true,
	// 					message: "Tham số conversationID không hợp lệ",
	// 					keyError: "params_conversationID_invalid",
	// 					status: 400,
	// 				})
	// 			}

	// 			if(populates && typeof populates === 'string'){
	// 				if(!IsJsonString(populates))
	// 					return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

	// 				populates = JSON.parse(populates);
	// 			} else{
    //                 populates = {
    //                     path: "",
    //                     select: ""
    //                 }
    //             }

	// 			let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
	// 				_id: conversationID,
	// 				members: { $in: [authorID] }
    //             }).lean();

    //             if(!checkExistConversation) {
	// 				return resolve({ 
	// 					error: true, 
	// 					message: "Bạn không phải thành viên của cuộc hội thoại", 
	// 					keyEror: 'you_are_not_member_of_conversation',
	// 					status: 403
	// 				});
	// 			}

	// 			if(isNaN(limit) || +limit > 20) {
	// 				limit = 20;
	// 			} else{
	// 				limit = +limit;
	// 			}

	// 			let conditionObjOrg = { ...conditionObj };
	// 			if(lastestID && checkObjectIDs(lastestID)){
	// 				let infoData = await CHATTING__MESSAGE_COLL.findById(lastestID);
	// 				if(!infoData)
	// 					return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

    //                 let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
	// 				if(!dataPagingAndSort || dataPagingAndSort.error)
	// 					return resolve({ error: true, message: "Can't get range pagination", status: 400 });

    //                 conditionObj  = dataPagingAndSort.data.find;
	// 				sortBy        = dataPagingAndSort.data.sort;
	// 			} else{
    //                 let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
	// 				sortBy = dataPagingAndSort.data.sort;
    //             }

	// 			let listNps = await CHATTING__MESSAGE_COLL
	// 				.find(conditionObj)
	// 				.limit(limit + 1)
	// 				.sort(sortBy)
	// 				.select(select)
	// 				.populate(populates)
	// 				.lean();

	// 			// GET TOTAL RECORD
	// 			let totalRecord = await CHATTING__MESSAGE_COLL.countDocuments(conditionObjOrg);
	// 			let nextCursor  = null;

	// 			if(listNps && listNps.length){
	// 				if(listNps.length > limit){
	// 					nextCursor = listNps[limit - 1]._id;
	// 					listNps.length = limit;
	// 				}
	// 			}

	// 			return resolve({
	// 				error: false,
	// 				status: 200,
	// 				data: {
	// 					listRecords: listNps,
	// 					limit,
	// 					totalRecord,
	// 					nextCursor
	// 				}
	// 			});
	// 		} catch (error) {
	// 			return resolve({ error: true, message: error.message, status: 500 });
	// 		}
	// 	})
	// }
}

exports.MODEL = new Model;
