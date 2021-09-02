"use strict";

/**
 * EXTERNAL PACKAGE
 */
const PromisePool									= require('@supercharge/promise-pool');
const moment										= require('moment');

/**
 * CONSTANTS
 */
const { REMINDER_NOTIFY_FOR, REMINDER_REPEAT }		= require('../helper/chatting.keys-constant');
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_REMINDER } 						= require('../../reminder/helper/reminder.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
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
const CHATTING__MESSAGE_REMINDER_COLL               = require('../database/chatting.message_reminder-coll');
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
	 * Func: Cập nhật user miss tin nhắn của cuộc hội thoại
	 * Date: 29/08/2021
	 */
	updateUserMissMessage({ conversationID, userID, numberMissMessage }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([conversationID, userID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK SENDER IS MEMBER OF CONVERSATION
				let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});

				// If usersMissMessage not exist or [] then add members conversation into usersMissMessage
				if(!infoConversation.usersMissMessage || !infoConversation.usersMissMessage.length){
					let usersMissMessage = [];

					infoConversation.members.filter(memberID => {
						if(memberID.toString() === userID.toString()){
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

					// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
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
							"elem.userID": { $nin: [userID] }
						}]
					})

					// Update miss message my self
					await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
						_id: conversationID,
						"usersMissMessage.userID": userID
					}, {
						$set: { "usersMissMessage.$.amount": 0 }
					});
				}

				return resolve({ error: false, message: 'success', status: 200 });
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn trong cuộc hội thoại
	 * Date: 06/08/2021
	 */
    insertMessage({ conversationID, senderID, content, receiversID, parentID, usersAssigned, files, type = 0, ctx }) {
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
					usersSeen: [senderID], 
					sender: senderID, 
					content, 
					conversation: conversationID,
					receivers: receiversID,
					type
				}
				parentID && (dataInsertMessage.parent = parentID);

				if(usersAssigned && usersAssigned.length && checkObjectIDs(usersAssigned)){
					dataInsertMessage.usersAssigned = usersAssigned;
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
					if(!usersAssigned || !usersAssigned.length || !checkObjectIDs(usersAssigned))
						return resolve({ error: true, message: "Request Params usersAssigned invalid", status: 400 });

					let listMessageShareContact = usersAssigned.map(memberID => ({
						usersSeen: [senderID],
						sender: senderID, 
						receivers: receiversID,
						conversation: conversationID,
						usersAssigned: [memberID],
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
	 * Func: Cập nhật Danh sách đã xem tin nhắn trong cuộc hội thoại
	 * Date: 30/08/2021
	 */
	updateSeenMessage({ conversationID, messageID, userID }){
        return new Promise(async(resolve) => {
            try {
                if(!checkObjectIDs([conversationID, messageID, userID]))
                    return resolve({ error: true, message: 'Request Params Invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
				let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});

				if(!infoConversation)
					return resolve({ error: true, message: "You aren't member of conversation", status: 403 });

                let infoMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                if(!infoMessage)
                    return resolve({ error: true, message: "Can't get info message", status: 403 });

				if(infoMessage.status === 3)
					return resolve({ error: true, message: "Message is recall", status: 403 });

				let infoMessageAfterUpdate = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, { 
					$set: { status: 2 },
					$addToSet: {
						usersSeen: userID
					}
				}, { new: true });

				if(!infoMessageAfterUpdate)
					return resolve({ error: true, message: "Can't update seen message", status: 403 });

				return resolve({ error: false, data: infoMessageAfterUpdate, status: 200 });
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
									usersSeen: [userID],
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

				await this.insertMessage({
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
					usersSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					poll: infoPollAfterInsert._id,
				}

				// INSERT MESSAGE NOTIFY CREATE POLL
				let infoMessageNotifyCreatePoll = await this.insertData({
					...dataInsertMessage,
					type: 110
				})

				// INSERT MESSAGE POLL
				let infoMessagePoll = await this.insertData({
					...dataInsertMessage,
					type: 5
				})

				if(!infoMessagePoll)
					return resolve({ error: true, message: "Can't create message poll", status: 403 });

				// UPDATE LAST MESSAGE
                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessagePoll._id, modifyAt: Date.now()
                }, { new: true });

				if(!checkLastMessageAfterUpdated)
					return resolve({ error: true, message: "Can't update last message", status: 403 });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 2 });

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
	 * Date: 28/08/2021
	 */
	updateMessagePoll({ conversationID, messageID, newVotes, votesCancel, newOptions, userID }) {
		return new Promise(async (resolve) => {
			try {
				if (!checkObjectIDs([messageID, userID, conversationID])) 
					return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member", status: 403 });

				let infoMessagePoll = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id poll')
					.populate('poll');

				if(!infoMessagePoll || !infoMessagePoll.poll)
					return resolve({ error: true, message: "Can't get info message poll", status: 403 });

				let { poll } = infoMessagePoll;

				// Check the user who vote for the first time, Then create message notify
				let isFirstTimeVote = true;
				poll.options.map(option => {
					if(option.usersVote.includes(userID)){
						isFirstTimeVote = false;
					}
				})

				// INSERT NEW OPTIONS FOR MESSAGE POLL
				if(newOptions && newOptions.length){
					let listOptionsName = newOptions.map(option => option.title);

					await CHATTING__MESSAGE_POLL_COLL.findOneAndUpdate({
						_id: poll._id,
						"options.title": {
							$nin: listOptionsName
						}
					}, {
						$addToSet: {
							options: newOptions
						}
					});
				}

				// PULL USER VOTE MESSAGE POLL
				if(votesCancel && votesCancel.length && checkObjectIDs(votesCancel)){
					await CHATTING__MESSAGE_POLL_COLL.findByIdAndUpdate(poll._id, {
						$pull: {
							"options.$[elem].usersVote": userID
						}
					}, {
						arrayFilters: [{ 
							"elem._id": { $in: votesCancel }
						}]
					});
				}

				// PUSH USER VOTE MESSAGE POLL
				if(newVotes && newVotes.length && checkObjectIDs(newVotes)){
					await CHATTING__MESSAGE_POLL_COLL.findByIdAndUpdate(poll._id, {
						$addToSet: {
							"options.$[elem].usersVote": userID
						}
					}, {
						arrayFilters: [{ 
							"elem._id": { $in: newVotes }
						}]
					});
				}

				let lastMessage = null;
				let numberMissMessage = 0;
				let dataInsertMessage = {
					usersSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					poll: poll._id,
				}

				// INSERT MESSAGE NOTIFY JOIN VOTE POLL
				if(isFirstTimeVote){
					lastMessage = await this.insertData({
						...dataInsertMessage,
						type: 111
					})
					numberMissMessage++;
				}

				// INSERT MESSAGE NOTIFY CHANGE VOTE POLL
				if((votesCancel.length || newVotes.length || newOptions.length) && !isFirstTimeVote){
					lastMessage = await this.insertData({
						...dataInsertMessage,
						type: 112
					})
					numberMissMessage++;
				}

				let infoMessagePollAfterUpdate = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate('poll')
					.lean();

				if(!infoMessagePollAfterUpdate)
					return resolve({ error: true, message: "Can't get info message poll", status: 403 });

				// UPDATE LAST MESSAGE
				if(lastMessage){
					let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: lastMessage._id, modifyAt: Date.now()
					}, { new: true });

					if(!checkLastMessageAfterUpdated)
						return resolve({ error: true, message: "Can't update last message", status: 403 });
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage });

				return resolve({ 
					error: false, 
					status: 200,
					data: infoMessagePollAfterUpdate
				});
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Đóng tin nhắn bình chọn trong cuộc hội thoại 
	 * Date: 30/08/2021
	 */
	closeMessagePoll({ conversationID, messageID, userID }) {
		return new Promise(async resolve => {
			try {
				if (!checkObjectIDs([messageID, userID, conversationID])) 
					return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member", status: 403 });

				let infoMessagePoll = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id poll')
					.populate('poll');

				if(!infoMessagePoll || !infoMessagePoll.poll)
					return resolve({ error: true, message: "Can't get info message poll", status: 403 });

				let { poll } = infoMessagePoll;

				if(poll.status === 2)
					return resolve({ error: true, message: "Poll is closed", status: 403 });

				const infoPoll = await CHATTING__MESSAGE_POLL_COLL.findByIdAndUpdate(poll._id, {
					$set: {
						status: 2
					}
				}, { new: true });

				if(!infoPoll)
					return resolve({ error: true, message: "Can't update status poll", status: 403 });

				const infoMessageNotify = await this.insertData({
					usersSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					poll: poll._id,
					type: 113
				})

				// UPDATE LAST MESSAGE
				if(infoMessageNotify){
					let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: infoMessageNotify._id, modifyAt: Date.now()
					}, { new: true });
	
					if(!checkLastMessageAfterUpdated)
						return resolve({ error: true, message: "Can't update last message", status: 403 });
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoPoll,
						infoMessageNotify
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Danh sách tin nhắn bình chọn trong cuộc hội thoại
	 * Date: 30/08/2021
	 */
	getListMessagePoll({ conversationID, lastestMessageID, userID }) {
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

				if(lastestMessageID && !checkObjectIDs(lastestMessageID))
					return resolve({ error: true, message: 'Request params lastestMessageID invalid', status: 400 });

				let nextPage = false;
				let perPage  = 15;

				if(lastestMessageID && checkObjectIDs(lastestMessageID)){
					nextPage = true;
				}

				let conditionObj = {};
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
				}

				// Get info last message (limit 20 per list message)
				if(nextPage){
					let messageInfo = await CHATTING__MESSAGE_COLL.findById(lastestMessageID);
					if(!messageInfo)
						return resolve({ error: true, message: "Can't get info last message", status: 403 });

					let nextInfo = `${messageInfo.modifyAt}_${messageInfo._id}`;

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys: ['modifyAt__-1', '_id__-1'] });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: 'Request params nextInfo invalid', status: 400 });

					conditionObj = dataPagingAndSort.data.find;
				}
				conditionObj.conversation 	= conversationID;
				conditionObj.type 			= 5;

				let	listMessagesPoll = await CHATTING__MESSAGE_COLL
					.find(conditionObj)
					.select('_id sender status type poll')
					.populate({
						path: 'sender',
						select: '_id name fullname companysign'
					})
					.populate({
						path: 'poll',
						populate: {
							path: 'options.usersVote',
							select: '_id name fullname image'
						},
					})
					.limit(perPage)
					.sort(sortBy)
					.lean();

				if(!listMessagesPoll)
					return resolve({ error: true, message: "Can't get list message poll", status: 403 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						listMessagesPoll,
						perPage
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

    /**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn nhắc hẹn trong cuộc hội thoại
	 * Date: 01/09/2021
	 */
	insertMessageReminder({ conversationID, content, notifyFor, remindTime, repeat, userID, ctx }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([userID, conversationID]))
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				if(!REMINDER_NOTIFY_FOR.includes(notifyFor))
					return resolve({ error: true, message: 'Request Params Notify For invalid', status: 400 });

				if(!REMINDER_REPEAT.includes(repeat))
					return resolve({ error: true, message: 'Request Params Repeat invalid', status: 400 });

				if(!moment(remindTime).isValid())
					return resolve({ error: true, message: 'Request Params Remind Time invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				// const responseAgenda = await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_REMINDER_CONVERSATION}`, {
				// 	conversationID,
				// 	userID,
				// 	remindTime,
				// 	repeat,
				// 	notifyFor
				// });
				// return resolve({ error: false, message: 'Yaa!!! Tada', data: responseAgenda, status: 200 });

				// INSERT MESSAGE REMINDER
				let infoReminderAfterInsert = await CHATTING__MESSAGE_REMINDER_COLL.create({
					content, 
					notifyFor, 
					remindTime: new Date(remindTime), 
					repeat
				})

				if(!infoReminderAfterInsert)
					return resolve({ error: true, message: "Can't create reminder", status: 403 });

				let dataInsertMessage = {
					usersSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: infoReminderAfterInsert._id
				}

				// INSERT MESSAGE NOTIFY CREATE REMINDER
				let infoMessageNotifyCreateReminder = await this.insertData({
					...dataInsertMessage,
					type: 114
				})

				// INSERT MESSAGE REMINDER
				let infoMessageReminder = await this.insertData({
					...dataInsertMessage,
					type: 4
				})

				if(!infoMessageReminder)
					return resolve({ error: true, message: "Can't create message reminder", status: 403 });

				// UPDATE LAST MESSAGE
                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessageReminder._id, modifyAt: Date.now()
                }, { new: true });

				if(!checkLastMessageAfterUpdated)
					return resolve({ error: true, message: "Can't update last message", status: 403 });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 2 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoMessageNotifyCreateReminder,
						infoMessageReminder
					}, 
				});
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật tin nhắn nhắc hẹn trong cuộc hội thoại
	 * Date: 01/09/2021
	 */
	updateMessageReminder({ conversationID, messageID, content, remindTime, repeat, userID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([userID, conversationID, messageID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				if(!REMINDER_REPEAT.includes(repeat))
					return resolve({ error: true, message: 'Request Params Repeat invalid', status: 400 });

				if(!moment(remindTime).isValid())
					return resolve({ error: true, message: 'Request Params Remind Time invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				let infoMessageReminder = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate('reminder');

				if(!infoMessageReminder || !infoMessageReminder.reminder)
					return resolve({ error: true, message: "Can't get info message reminder", status: 403 });

				let { reminder } = infoMessageReminder;

				// UPDATE MESSAGE REMINDER
				let infoReminderAfterUpdate = await CHATTING__MESSAGE_REMINDER_COLL.findByIdAndUpdate(reminder._id, {
					$set: {
						content, 
						remindTime: new Date(remindTime),
						repeat
					}
				}, { new: true })

				if(!infoReminderAfterUpdate)
					return resolve({ error: true, message: "Can't update reminder", status: 403 });

				// INSERT MESSAGE NOTIFY UPDATE REMINDER
				let infoMessageNotifyUpdateReminder = await this.insertData({
					usersSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: reminder._id,
					type: 115
				})

				if(!infoMessageNotifyUpdateReminder)
					return resolve({ error: true, message: "Can't update message reminder", status: 403 });

				// UPDATE LAST MESSAGE
                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessageNotifyUpdateReminder._id, modifyAt: Date.now()
                }, { new: true });

				if(!checkLastMessageAfterUpdated)
					return resolve({ error: true, message: "Can't update last message", status: 403 });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoMessageNotifyUpdateReminder,
						infoReminderAfterUpdate
					}, 
				});
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật tin nhắn nhắc hẹn trong cuộc hội thoại
	 * Date: 01/09/2021
	 */
	updateUsersJoinReminder({ conversationID, messageID, isJoin, userID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([userID, conversationID, messageID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				let infoMessageReminder = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate('reminder');

				if(!infoMessageReminder || !infoMessageReminder.reminder)
					return resolve({ error: true, message: "Can't get info message reminder", status: 403 });

				let { reminder } 			= infoMessageReminder;
				let infoReminderAfterUpdate = null;
				let typeMessage 			= 117; // Xác nhận không tham gia nhắc hẹn

				// USER JOIN REMINDER
				if(isTrue(isJoin)){
					infoReminderAfterUpdate = await CHATTING__MESSAGE_REMINDER_COLL.findByIdAndUpdate(reminder._id, {
						$addToSet: {
							accepts: userID
						},
						$pull: {
							rejects: userID
						}
					}, { new: true })

					typeMessage = 116; // Xác nhận tham gia nhắc hẹn

				} else{ // USER NOT JOIN REMINDER
					infoReminderAfterUpdate = await CHATTING__MESSAGE_REMINDER_COLL.findByIdAndUpdate(reminder._id, {
						$addToSet: {
							rejects: userID
						},
						$pull: {
							accepts: userID
						}
					}, { new: true })
				}

				if(!infoReminderAfterUpdate)
					return resolve({ error: true, message: "Can't update user join reminder", status: 403 });

				// INSERT MESSAGE NOTIFY UPDATE USER JOIN REMINDER
				let infoMessageNotifyUserJoinReminder = await this.insertData({
					usersSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: reminder._id,
					type: typeMessage
				})

				if(!infoMessageNotifyUserJoinReminder)
					return resolve({ error: true, message: "Can't update message reminder", status: 403 });

				// UPDATE LAST MESSAGE
                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessageNotifyUserJoinReminder._id, modifyAt: Date.now()
                }, { new: true });

				if(!checkLastMessageAfterUpdated)
					return resolve({ error: true, message: "Can't update last message", status: 403 });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoMessageNotifyUserJoinReminder,
						infoReminderAfterUpdate
					}, 
				});
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Xoá nhắc hẹn trong cuộc hội thoại
	 * Date: 01/09/2021
	 */
	deleteReminder({ conversationID, messageID, userID }) {
		return new Promise(async resolve => {
			try {
				if (!checkObjectIDs([messageID, userID, conversationID])) 
					return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member", status: 403 });

				let infoMessageReminder = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id reminder')
					.populate('reminder');

				if(!infoMessageReminder || !infoMessageReminder.reminder)
					return resolve({ error: true, message: "Can't get info message reminder", status: 403 });

				let { reminder } = infoMessageReminder;

				if(reminder.status === 2)
					return resolve({ error: true, message: "Reminder is deleted", status: 403 });

				const infoReminderAfterDelete = await CHATTING__MESSAGE_REMINDER_COLL.findByIdAndUpdate(reminder._id, {
					$set: {
						status: 2
					}
				}, { new: true });

				if(!infoReminderAfterDelete)
					return resolve({ error: true, message: "Can't update status reminder", status: 403 });

				// INSERT MESSAGE NOTIFY DELETE REMINDER
				const infoMessageNotify = await this.insertData({
					usersSeen: [userID], 
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: reminder._id,
					type: 118 // Xoá nhắc hẹn
				})

				// UPDATE LAST MESSAGE
				if(infoMessageNotify){
					let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: infoMessageNotify._id, modifyAt: Date.now()
					}, { new: true });
	
					if(!checkLastMessageAfterUpdated)
						return resolve({ error: true, message: "Can't update last message", status: 403 });
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoMessageNotify,
						infoReminderAfterDelete,
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

}

exports.MODEL = new Model;