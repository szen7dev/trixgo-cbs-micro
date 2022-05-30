"use strict";

/**
 * EXTERNAL
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { NPS_TYPE } 									= require('../helper/chatting.keys-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, IsJsonString }				= require('../../../tools/utils/utils');

/**
 * COLLECTIONS, MODELS
 */
const CHATTING__MESSAGE_COLL						= require('../database/chatting.message-coll');
const CHATTING__MESSAGE_NPS_COLL					= require('../database/chatting.message_nps-coll');
const CHATTING__CONVERSATION_COLL               	= require('../database/chatting.conversation-coll');
const CHATTING__MESSAGE_MODEL               		= require('../model/chatting.message-model').MODEL;

class Model extends BaseModel {

    constructor() {
        super(CHATTING__MESSAGE_NPS_COLL);

		this.SERVICE_SCORE = 1;
    }

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn nps mới
	 * Date: 20/02/2022
	 */
	insert({ type, conversationID, serviceID, userID }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([userID])) {
					return resolve({
						error: true,
						message: 'Tham số userID không hợp lệ',
						keyError: 'params_userID_invalid',
						status: 400
					});
				}

				if(!checkObjectIDs([conversationID, serviceID])) {
					return resolve({
						error: true,
						message: 'Tham số conversationID hoặc serviceID không hợp lệ',
						keyError: 'params_conversationID_or_serviceID_invalid',
						status: 400
					});
				}

				if(!NPS_TYPE.includes(type)) {
					return resolve({
						error: true,
						message: 'Tham số type là không hợp lệ',
						keyError: 'params_type_invalid',
						status: 400
					});
				}

				let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                })
				.select('members')
				.lean();

                if(!infoConversation) {
					return resolve({
						error: true,
						message: "Bạn không phải thành viên của cuộc hội thoại",
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				// INSERT NPS
				let infoNpsAfterInsert = await this.insertData({
					type,
					service: serviceID,
					status: 1
				})

				if(!infoNpsAfterInsert) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyEror: 'error_occurred',
						status: 422
					});
				}

				let dataInsertMessage = {
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: infoConversation.members,
					nps: infoNpsAfterInsert._id,
					type: 8
				}

				// INSERT MESSAGE NPS
				let infoMessageNps = await CHATTING__MESSAGE_MODEL.insertData(dataInsertMessage);

				if(!infoMessageNps) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyEror: 'error_occurred',
						status: 422
					});
				}

				// UPDATE LAST MESSAGE
                await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessageNps._id, modifyAt: Date.now()
                });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await CHATTING__MESSAGE_MODEL.updateUserMissMessage({
					conversationID,
					userID,
					numberMissMessage: 1
				});

				return resolve({
					error: false,
					status: 200,
					data: infoMessageNps
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật nps
	 * Date: 20/02/2022
	 */
	update({ conversationID, messageID, score, reasons, userID }) {
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, messageID])) {
					return resolve({
						error: true,
						message: "Tham số conversationID hoặc messageID không hợp lệ",
						keyError: 'params_conversationID_or_messageID_invalid',
						status: 400
					});
				}

				// CHECK USER IS MEMBER OF CONVERSATION
				let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!infoConversation) {
					return resolve({
						error: true,
						message: "Bạn không phải thành viên của cuộc hội thoại",
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				let infoMessage = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id nps')
					.populate('nps')
					.lean();

				if(!infoMessage || !infoMessage.nps) {
					return resolve({
						error: true,
						message: "Tin nhắn không tồn tại",
						keyEror: 'message_is_not_exists',
						status: 400
					});
				}

				let { nps } = infoMessage;

				// Check the user who vote for the first time, Then create message notify
				let isVoted = nps.usersVote.find(item => item.user.toString() === userID);

				// PULL USER VOTE MESSAGE NPS
				await CHATTING__MESSAGE_NPS_COLL.findByIdAndUpdate(nps._id, {
					$pull: {
						"usersVote.$[elem].user": userID
					}
				});

				// PUSH USER VOTE MESSAGE NPS
				if(nps.type === this.SERVICE_SCORE) {
					await CHATTING__MESSAGE_NPS_COLL.findByIdAndUpdate(nps._id, {
						$addToSet: {
							usersVote: {
								user: userID,
								score
							}
						}
					});
				} else if(reasons && reasons.length && checkObjectIDs(reasons)){
					await CHATTING__MESSAGE_NPS_COLL.findByIdAndUpdate(nps._id, {
						$addToSet: {
							usersVote: {
								user: userID,
								reasons: reasons
							}
						}
					});
				}

				let lastMessage = null;
				let dataInsertMessage = {
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: infoConversation.members,
					nps: nps._id,
				}

				// INSERT MESSAGE NOTIFY JOIN VOTE NPS
				if(isVoted){
					lastMessage = await CHATTING__MESSAGE_MODEL.insertData({
						...dataInsertMessage,
						type: 120 // Tham gia bình chọn trong cuộc hội thoại
					})
				} else if(reasons.length) {
					lastMessage = await CHATTING__MESSAGE_MODEL.insertData({
						...dataInsertMessage,
						type: 121 // Thay đổi bình chọn trong cuộc hội thoại
					})
				}

				infoMessage = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate({
						path: 'nps service',
						populate: {
							path: 'usersVote.user usersVote.reasons',
							select: '_id bizfullname fullname image'
						}
					})
					.lean();

				// UPDATE LAST MESSAGE & UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				if(lastMessage){
					await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: lastMessage._id, modifyAt: Date.now()
					});

					await CHATTING__MESSAGE_MODEL.updateUserMissMessage({
						conversationID,
						userID,
						numberMissMessage: 1
					});
				}

				return resolve({
					error: false,
					status: 200,
					data: infoMessage
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Đóng nps
	 * Date: 20/02/2022
	 */
	closeNps({ conversationID, messageID, userID }) {
		return new Promise(async resolve => {
			try {
				if (!checkObjectIDs([messageID, userID, conversationID])) {
					return resolve({
						error: true,
						message: "Tham số messageID hoặc conversationID không hợp lệ",
						keyEror: 'params_messageID_or_conversationID_invalid',
						status: 400
					});
				}

				// CHECK USER IS MEMBER OF CONVERSATION
				let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!infoConversation) {
					return resolve({
						error: true,
						message: "Bạn không phải thành viên của cuộc hội thoại",
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				let infoMessage = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id nps')
					.populate('nps')
					.lean();

				if(!infoMessage || !infoMessage.nps) {
					return resolve({
						error: true,
						message: "Tin nhắn không tồn tại",
						keyEror: 'message_is_not_exists',
						status: 400
					});
				}

				let { nps } = infoMessage;

				if(nps.status === 2) {
					return resolve({
						error: true,
						message: "Tin nhắn nps đã được đóng",
						keyEror: 'message_nps_is_closed',
						status: 400
					});
				}

				const infoNps = await CHATTING__MESSAGE_NPS_COLL.findByIdAndUpdate(nps._id, {
					$set: {
						status: 2
					}
				}, { new: true });

				if(!infoNps) {
					return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyEror: 'error_occurred',
						status: 422
					});
				}

				// INSERT MESSAGE NOTIFY CLOSE NPS
				const lastMessage = await CHATTING__MESSAGE_MODEL.insertData({
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: infoConversation.members,
					nps: nps._id,
					type: 122
				})

				// UPDATE LAST MESSAGE & UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				if(lastMessage){
					await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: lastMessage._id, modifyAt: Date.now()
					}, { new: true });

					await CHATTING__MESSAGE_MODEL.updateUserMissMessage({
						conversationID,
						userID,
						numberMissMessage: 1
					});
				}

				return resolve({
					error: false,
					status: 200,
					data: infoNps
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách nps
	 * Date: 20/02/2022
	 */
	getList({ conversationID, lastestID, limit = 10, select, populates, userID }){
		return new Promise(async resolve => {
			try {
				let conditionObj = { conversation: conversationID, type: 8 };
                let sortBy = {};
                let keys = ['createAt__-1', '_id__-1'];

				if(!checkObjectIDs([userID])) {
					return resolve({
						error: true,
						message: "Tham số userID không hợp lệ",
						keyError: "params_userID_invalid",
						status: 400,
					})
				}

				if(!checkObjectIDs([conversationID])) {
					return resolve({
						error: true,
						message: "Tham số conversationID không hợp lệ",
						keyError: "params_conversationID_invalid",
						status: 400,
					})
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

				let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                }).lean();

                if(!infoConversation) {
					return resolve({
						error: true,
						message: "Bạn không phải thành viên của cuộc hội thoại",
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				if(isNaN(limit) || +limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

				let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CHATTING__MESSAGE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy = dataPagingAndSort.data.sort;
                }

				let listNps = await CHATTING__MESSAGE_COLL
					.find(conditionObj)
					.limit(limit + 1)
					.sort(sortBy)
					.select(select)
					.populate(populates)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await CHATTING__MESSAGE_COLL.countDocuments(conditionObjOrg);
				let nextCursor  = null;

				if(listNps && listNps.length){
					if(listNps.length > limit){
						nextCursor = listNps[limit - 1]._id;
						listNps.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listNps,
						limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách user vote nps
	 * Date: 22/02/2022
	 */
	getListUsersVote({ conversationID, messageNPSID, lastestID, limit = 10, select, populates, authorID }) {
		return new Promise(async resolve => {
			try {
				const conditionObj = {};
				const scores = [1,2,3,4,5,6,7,8,9,10];

				if(!checkObjectIDs([authorID])) {
					return resolve({
						error: true,
						message: "Tham số authorID không hợp lệ",
						keyError: "params_authorID_invalid",
						status: 400,
					})
				}

				if(!checkObjectIDs([conversationID, messageNPSID])) {
					return resolve({
						error: true,
						message: "Tham số conversationID hoặc messageNPSID không hợp lệ",
						keyError: "params_conversationID__or_messageNPSID_invalid",
						status: 400,
					})
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [authorID] }
                }).lean();

                if(!checkExistConversation) {
					return resolve({
						error: true,
						message: "Bạn không phải thành viên của cuộc hội thoại",
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				const infoMessageNPS = await CHATTING__MESSAGE_NPS_COLL
					.findById(messageNPSID)
					.select(select)
					.populate(populates)
					.lean();

				if(!infoMessageNPS) {
					return resolve({
						error: true,
						message: "Tin nhắn không tồn tại",
						keyEror: 'message_not_exists',
						status: 400
					});
				}

				let groupScore = await CHATTING__MESSAGE_NPS_COLL.aggregate([
                    {
                        $match: {
                            _id: ObjectID(messageNPSID)
                        }
                    },
                    {
                        $group: {
                            _id: "$usersVote.score",
                            amount: { $sum: 1 },
                        }
                    }
                ]);
				console.log({ groupScore })

				// if(infoMessageNPS.type === 1) {
				// 	scores.map(score => {
				// 		infoMessageNPS.usersVote.find(user => user.score === score);
				// 	})
				// }

				return resolve({ error: false, status: 200 });
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

}

exports.MODEL = new Model;
