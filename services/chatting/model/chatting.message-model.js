"use strict";

/**
 * EXTERNAL PACKAGE
 */
const PromisePool									= require('@supercharge/promise-pool');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');

/**
 * TOOLS
 */
const { 
	isTrue,
	checkObjectIDs, 
	checkNumberIsValidWithRange 
} = require('../../../tools/utils/utils');

/**
 * BASE
 */
const BaseModel                                     = require('../../../tools/db/base_model');

/**
 * COLLECTIONS
 */
const CHATTING__MESSAGE_COLL                        = require('../database/chatting.message-coll');
const CHATTING__MESSAGE_POLL_COLL                   = require('../database/chatting.message_poll-coll');
const CHATTING__CONVERSATION_COLL                   = require('../database/chatting.conversation-coll');

/**
 * MODELS
 */
const CHATTING__CONVERSATION_FILE_MODEL				= require('../model/chatting.conversation_file-model').MODEL;
const CHATTING__CONVERSATION_LINK_MODEL				= require('../model/chatring.conversation_link-model').MODEL;


class Model extends BaseModel {

    constructor() {
        super(CHATTING__MESSAGE_COLL);
    }

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn trong cuộc hội thoại
	 * Date: 06/08/2021
	 */
    insertMessage({ conversationID, senderID, content, receiversID, parentID, membersAssigned, files, type = 0, ctx }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([senderID, conversationID])) 
                    return resolve({ error: true, message: 'Request Params senderID or conversationID invalid', status: 400 });

				// CHECK SENDER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [senderID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				if(!receiversID){
					receiversID = checkExistConversation.members;
				} else{
					if (!checkObjectIDs(receiversID)) 
                    	return resolve({ error: true, message: 'Request Params receiversID invalid', status: 400 });
				}

				if(parentID && !checkObjectIDs(parentID))
					return resolve({ error: true, message: 'Request Param parentID invalid', status: 400 });

				let dataInsertMessage = {
					listSeen: [senderID], 
					sender: senderID, 
					content, 
					conversation: conversationID,
					receivers: receiversID,
					type
				}
				parentID && (dataInsertMessage.parent = parentID);

				if(membersAssigned && membersAssigned.length && checkObjectIDs(membersAssigned)){
					dataInsertMessage.membersAssigned = membersAssigned;
				}

				// MESSAGE IMAGES, FILES
				if(files && files.length && checkNumberIsValidWithRange({ arrValid: [1,2], val: type }) && ctx){

					let listFilesMessage = files.map(file => ({
						app: CF_DOMAIN_SERVICES.CHATTING,
						name: file.name,
						url: file.url,
						size: file.size,
						userID: senderID,
					}))

					const { results } = await PromisePool
						.for(listFilesMessage)
						.withConcurrency(2)
						.process(async file => {
							// Insert file core collection
							let infoFile = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, file);

							// Update status file core collection
							await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.UPDATE_STATUS_FILE}`, {
								fileID: infoFile.data && infoFile.data._id.toString(),
								status: "1",
								userID: senderID,
							});

							// Insert conversation file collection
							let infoAfterInserted = await CHATTING__CONVERSATION_FILE_MODEL.insert({
								conversationID,
								fileID: infoFile.data && infoFile.data._id
							});

							return { file: infoAfterInserted.data && infoAfterInserted.data._id }
						})

					dataInsertMessage.files = results;
				}

				// MESSAGE LINK
				if(content){
					let urlRegex = /((((https|http|HTTP|HTTPS|ftp)?:\/\/)|(www\.))[^\s]+)/g;
					let allLinks = content.match(urlRegex);

					if(allLinks && allLinks.length){
						let listMessageLinks = allLinks.map(link => ({
							conversationID, 
							userID: senderID,
							link
						}))

						await PromisePool
							.for(listMessageLinks)
							.withConcurrency(2)
							.process(async message => CHATTING__CONVERSATION_LINK_MODEL.insert(message))
					}
				}

				let infoMessageAfterInserted 	= null;
				let numberMissMessage 			= 1;

				// MESSAGE SHARE CONTACT
				if(+type === 7){
					if(!membersAssigned || !membersAssigned.length || !checkObjectIDs(membersAssigned))
						return resolve({ error: true, message: "Request Params membersAssigned invalid", status: 400 });

					let listMessageShareContact = membersAssigned.map(memberID => ({
						listSeen: [senderID],
						sender: senderID, 
						receivers: receiversID,
						conversation: conversationID,
						membersAssigned: [memberID],
						type: 7
					}))

					const { results } = await PromisePool
						.for(listMessageShareContact)
						.withConcurrency(2)
						.process(async message => this.insertData(message))

					numberMissMessage 		 = results.length;
					infoMessageAfterInserted = results[results.length - 1];
				} else{
					// MESSAGE NORMAL
					infoMessageAfterInserted = await this.insertData(dataInsertMessage);
				}

                if(!infoMessageAfterInserted)
                    return resolve({ error: true, message: "Can't create message", status: 403 });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				if(infoMessageAfterInserted.type < 100){

					// If usersMissMessage not exist or [] then add members conversation into usersMissMessage
					if(!checkExistConversation.usersMissMessage || !checkExistConversation.usersMissMessage.length){

						let usersMissMessage = [];
						checkExistConversation.members.filter(memberID => {
							if(memberID.toString() === senderID.toString()){
								usersMissMessage = [...usersMissMessage, {
									userID: memberID,
									amount: 0
								}];
							} else{
								usersMissMessage = [...usersMissMessage, {
									userID: memberID,
									amount: numberMissMessage
								}];
							}
						})

						await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
							$addToSet: { usersMissMessage }
						});
					} else{
						// Update miss message except current user
						await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
							$inc: {
								"usersMissMessage.$[elem].amount": numberMissMessage
							}
						}, {
							arrayFilters: [{ 
								"elem.userID": { $nin: [senderID] }
							}]
						})

						// Update miss message my self
						await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
							_id: conversationID,
							"usersMissMessage.userID": senderID
						}, {
							$set: { "usersMissMessage.$.amount": 0 }
						});
					}

				}

				let { _id: messageID } = infoMessageAfterInserted; 

				// UPDATE LAST MESSAGE
                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: messageID, modifyAt: Date.now()
                }, { new: true });

                if(!checkLastMessageAfterUpdated)
                    return resolve({ error: true, message: "Can't update last message", status: 403 });

                return resolve({ error: false, data: infoMessageAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Xoá tin nhắn của cuộc hội thoại (media, text)
	 * Date: 16/08/2021
	 */
	deleteMessage({ conversationID, userID, messagesID, filesID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([...messagesID, userID, conversationID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USERID IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({
					_id: conversationID,
					members: { $all: [userID] }
                });
                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				if(filesID && !checkObjectIDs(filesID))
					return resolve({ error: true, message: "Request Params Invalid", status: 400 });

				// Get list message will delete
				let listMessages = await CHATTING__MESSAGE_COLL.find({
					_id: { $in: messagesID },
					conversation: conversationID
				})
				.select('_id type')
				.lean();

				const { results: infoMessageAfterUpdated } = await PromisePool
					.for(listMessages)
					.withConcurrency(2)
					.process(async message => {
						let infoMessageAfterUpdated = null;

						switch (message.type) {
							case 0: // Xoá tin nhắn thông thường (text message)
								infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
									_id: message._id,
									conversation: conversationID
								}, {
									$addToSet: {
										usersDelete: userID
									}
								}, { new: true });
								break;
							case 1: // Xoá tin nhắn image, file (media message)
							case 2:
								infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
									_id: message._id,
									conversation: conversationID,
									files: {
										$elemMatch: {
											file: { $in: filesID }
										}
									}
								}, {
									$addToSet: {
										"files.$.usersDelete": userID
									}
								}, { new: true });
								break;
							default:
								break;
						}

						return infoMessageAfterUpdated;
					})

				if(!infoMessageAfterUpdated)
					return resolve({ error: true, message: "Can't delete message", status: 403 });

				return resolve({ error: false, data: infoMessageAfterUpdated, status: 200 });
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Thu hồi tin nhắn của cuộc hội thoại (media, text)
	 * Date: 16/08/2021
	 */
	revokeMessage({ conversationID, userID, messagesID, filesID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([...messagesID, userID, conversationID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USERID IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({
					_id: conversationID,
					members: { $all: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				if(filesID && !checkObjectIDs(filesID))
					return resolve({ error: true, message: "Request Params filesID Invalid", status: 400 });

				// Get list message will delete
				let listMessages = await CHATTING__MESSAGE_COLL.find({
					_id: { $in: messagesID },
					conversation: conversationID
				})
				.select('_id type')
				.lean();

				const { results: infoMessageAfterUpdated } = await PromisePool
					.for(listMessages)
					.withConcurrency(2)
					.process(async message => {
						let infoMessageAfterUpdated = null;

						switch (message.type) {
							case 0: // Thu hồi tin nhắn thông thường (text message)
								infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
									_id: message._id,
									conversation: conversationID,
									sender: userID
								}, {
									$set: { status: 3 }
								}, { new: true });
								break;
							case 1: // Thu hồi tin nhắn ảnh (media message)
							case 2:
								infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
									_id: message._id,
									conversation: conversationID,
									sender: userID,
									files: {
										$elemMatch: {
											file: { $in: filesID }
										}
									}
								}, {
									$set: {
										"files.$.status": 2
									}
								}, { new: true });
								break;
							default:
								break;
						}

						return infoMessageAfterUpdated;
					})

				if(!infoMessageAfterUpdated)
					return resolve({ error: true, message: "Can't revoke message", status: 403 });

				return resolve({ error: false, data: infoMessageAfterUpdated, status: 200 });
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Chia sẻ tin nhắn đến các cuộc hội thoại 
	 * Date: 25/08/2021
	 */
	shareMessageConversation({ conversationsID, messagesID, userID }){
		return new Promise(async resolve => {
			try {
				if (!checkObjectIDs([...conversationsID, ...messagesID, userID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USER ID IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({
					_id: { $in: conversationsID },
					members: { $all: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member of conversations", status: 403 });

				const { results } = await PromisePool
					.for(checkExistConversation)
					.withConcurrency(2)
					.process(async conversation => {

						const values = await PromisePool
							.for(messagesID)
							.withConcurrency(2)
							.process(async messageID => {
								// get info share message
								let infoMessageShare = await CHATTING__MESSAGE_COLL.findById(messageID);
								let { content, files, type } = infoMessageShare;

								// Insert message to conversation
								let infoAfterInserted = await this.insertData({
									conversation: conversation._id,
									sender: userID,
									listSeen: [userID],
									receivers: conversation.members,
									content,
									files,
									type
								});

								// Update last message
								await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversation._id, {
									lastMessage: infoAfterInserted._id, modifyAt: Date.now()
								}, { new: true });

								return infoAfterInserted;
							})

						return values;
					})

				return resolve({ error: false, data: results, status: 200 });
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật pin tin nhắn
	 * Date: 28/08/2021
	 */
	updatePinMessageConversation({ conversationID, messageID, userID, isPin }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([conversationID, messageID, userID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});
				if(!infoConversation)
					return resolve({ error: true, message: "You aren't member of conversation ", status: 403 });

				let infoConversationAfterUpdate = null;
				let typeMessage = 108;

				if(isTrue(isPin)){ // Pin tin nhắn

					if(infoConversation.messagesPin.includes(messageID))
						return resolve({ error: true, message: "Message is pined", status: 400 });

					// Pin tối đa 20 tin nhắn (pull last, push first)
					if(infoConversation.messagesPin.length >= 20){
						infoConversationAfterUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
							$push: {
								messagesPin: {
									$each: [messageID],
									$position: 0,
									$slice: 20
								}
							}
						}, { new: true });
					} else{
						infoConversationAfterUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
							$push: {
								messagesPin: {
									$each: [messageID],
									$position: 0
								}
							}
						}, { new: true });
					}

				} else{ // Bỏ Pin tin nhắn
					infoConversationAfterUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$pull: { messagesPin: messageID }
					}, { new: true });

					typeMessage = 109;
				}

				if(!infoConversationAfterUpdate)
					return resolve({ error: true, message: "Can't update pin message", status: 403 });

				await CHATTING__MESSAGE_MODEL.insertMessage({
					conversationID, 
					senderID: userID,
					type: typeMessage,
					receiversID: infoConversation.members,
				})

				return resolve({ error: false, data: infoConversationAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Danh sách tin nhắn được pin trong cuộc hội thoại (phân trang)
	 * Date: 28/08/2021
	 */
	getListMessagePinConversation({ conversationID, page, limit, userID }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});
				if(!infoConversation)
					return resolve({ error: true, message: "You aren't member of conversation ", status: 403 });

				if(!page || isNaN(page))
					page = 1;

				if(!limit || isNaN(limit))
					limit = 10;

				page  = +page;
				limit = +limit;

				let	listMessagesPined = await CHATTING__MESSAGE_COLL
					.find({
						_id: { $in: infoConversation.messagesPin },
						conversation: conversationID
					})
					.select('_id sender content status type poll files')
					.populate({
						path: 'sender poll',
						select: '_id name fullname companysign'
					})
					.populate({
						path: 'files.file',
						select: '_id',
						populate: {
							path: 'file',
							select: '_id name url status'
						},
					})
					.limit(limit)
					.skip((page * limit) - limit)
					.lean();

				if(!listMessagesPined)
					return resolve({ error: true, message: "Can't get list message pin", status: 403 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						listMessagesPined,
						perPage: limit,
						currentPage: page,
						totalRecord: infoConversation.messagesPin.length
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn bình chọn trong cuộc hội thoại 
	 * Date: 25/08/2021
	 */
	insertMessagePoll({ conversationID, name, options, userID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([userID, conversationID]) || !name || !options.length) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				// INSERT MESSAGE POLL
				let infoPollAfterInsert = await CHATTING__MESSAGE_POLL_COLL.create({
					name,
					options
				})

				if(!infoPollAfterInsert)
					return resolve({ error: true, message: "Can't create poll", status: 403 });

				let dataInsertMessage = {
					listSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
				}

				// INSERT MESSAGE NOTIFY CREATE POLL
				let infoMessageNotifyCreatePoll = await this.insertData({
					...dataInsertMessage,
					type: 110
				})

				// INSERT MESSAGE POLL
				let infoMessagePoll = await this.insertData({
					...dataInsertMessage,
					poll: infoPollAfterInsert._id,
					type: 5
				})

				if(!infoMessagePoll)
					return resolve({ error: true, message: "Can't create message poll", status: 403 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoMessageNotifyCreatePoll,
						infoMessagePoll
					}, 
				});
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật bình chọn của 1 user trong cuộc hội thoại 
	 * Date: 25/08/2021
	 */
	updateMessagePoll({ conversationID, name, options, userVote, userID }) {
		return new Promise(async (resolve) => {
			try {
				if (!checkObjectIDs([userID, conversationID])) 
					return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member", status: 403 });

				// INSERT MESSAGE POLL
				let infoPollAfterInsert = await CHATTING__MESSAGE_POLL_COLL.create({
					name,
					options
				})

				if(!infoPollAfterInsert)
					return resolve({ error: true, message: "Can't create poll", status: 403 });

				let dataInsertMessage = {
					listSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
				}

				// INSERT MESSAGE NOTIFY CHANGE POLL
				let infoMessageNotifyCreatePoll = await this.insertData({
					...dataInsertMessage,
					type: 111
				})

				if(!infoMessagePoll)
					return resolve({ error: true, message: "Can't create message poll", status: 403 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoMessageNotifyCreatePoll,
						infoMessagePoll
					}, 
				});
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}
	
    //cập nhật trạng thái tin nhắn đã xem
    seenMessageOneByOne({ messageID, userID }){
        return new Promise(async(resolve) => {
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'object_invalid', status: 400 });

                let checkExitsMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                if(!checkExitsMessage)
                    return resolve({ error: true, message: 'message_is_not_exists', status: 403 });

                if(checkExitsMessage.status >= 100)
                    return resolve({ error: true, message: 'status_greater_than_100', status: 403 });

				let infoMessage = null;
                if(checkExitsMessage.listSeen){
                    let listSeen = checkExitsMessage.listSeen;

                    if(!listSeen.includes(userID)){
                        listSeen = listSeen.concat([userID]);
                        infoMessage = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, { status: 1, listSeen }, { new: true });

                        if(!infoMessage)
                            return resolve({ error: true, message: 'cannot_update', status: 403 });

                        return resolve({ error: false, data: infoMessage, status: 200 });
                    } else{
                        return resolve({ error: false, data: checkExitsMessage, status: 200 });
                    }
                } else{
                    let listSeen = [userID];
                    infoMessage = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, { status: 1, listSeen }, { new: true });

                    if(!infoMessage)
                        return resolve({ error: true, message: 'cannot_update', status: 400 });

                    return resolve({ error: false, data: infoMessage, status: 200 });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;