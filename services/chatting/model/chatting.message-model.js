"use strict";

/**
 * EXTERNAL PACKAGE
 */
const PromisePool									= require('@supercharge/promise-pool');
const moment										= require('moment');

/**
 * CONSTANTS
 */
const { REMINDER_NOTIFY_FOR, REMINDER_REPEAT, REACTION_TYPES }		= require('../helper/chatting.keys-constant');
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REMINDER } 						= require('../../reminder/helper/reminder.actions-constant');
const { CF_ACTIONS_REACTION } 						= require('../../reaction/helper/reaction.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
const {
	checkObjectIDs,
	checkNumberIsValidWithRange,
	IsJsonString
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

				// CHECK USER IS MEMBER OF CONVERSATION
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
    insertMessage({
		conversationID, senderID, content, receiversID, parentID, usersAssigned, files, location, type = 0
	}) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([senderID, conversationID]))
                    return resolve({ error: true, message: 'Request Params senderID or conversationID invalid', status: 400 });

				// CHECK SENDER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [senderID] }
                }).lean();

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				// Check config admin conversation
				if(checkExistConversation.config && checkExistConversation.config.configSendMessage === 2){
					const listAuthorsID = checkExistConversation.authors.map(author => author.toString());

					// User is not author of conversation
					if(!listAuthorsID.includes(senderID))
						return resolve({ error: true, message: "You don't have permission to send message", status: 403 });
				}

				if(!receiversID || !receiversID.length){
					receiversID = checkExistConversation.members;
				} else{
					if (!checkObjectIDs(receiversID))
                    	return resolve({ error: true, message: 'Request Params receiversID invalid', status: 400 });
				}

				if(parentID && !checkObjectIDs(parentID))
					return resolve({ error: true, message: 'Request Param parentID invalid', status: 400 });

				if(usersAssigned && usersAssigned.length && !checkObjectIDs(usersAssigned))
					return resolve({ error: true, message: 'Request Param usersAssigned invalid', status: 400 });

				let dataInsertMessage = {
					usersSeen: [senderID],
					sender: senderID,
					content,
					conversation: conversationID,
					receivers: receiversID,
					type
				}
				parentID 		&& (dataInsertMessage.parent 		= parentID);
				usersAssigned 	&& (dataInsertMessage.usersAssigned = usersAssigned);

				// MESSAGE IMAGES, FILES
				if(files && files.length && checkObjectIDs(files) && checkNumberIsValidWithRange({ arrValid: [1,2], val: type })){
					let listFilesMessage = files.map(file => ({
						conversationID,
						fileID: file
					}))

					const { results } = await PromisePool
						.for(listFilesMessage)
						.withConcurrency(2)
						.process(async file => {
							// Insert conversation file collection
							const infoAfterInserted = await CHATTING__CONVERSATION_FILE_MODEL.insert(file);
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
							senderID,
							link
						}))

						await PromisePool
							.for(listMessageLinks)
							.withConcurrency(2)
							.process(async message => CHATTING__CONVERSATION_LINK_MODEL.insert(message))
					}
				}

				let infoMessageAfterInserted = null;
				let numberMissMessage		 = 1;
				console.log({ dataInsertMessage })

				switch (+type) {
					case 6: // MESSAGE SHARE LOCATION
						infoMessageAfterInserted = await this.insertData({
							...dataInsertMessage,
							location: {
								type: "Point",
								coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
							}
						})
						break;
					case 7: // MESSAGE SHARE CONTACT
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
						break;
					default: // MESSAGE NORMAL OR NOTI
						infoMessageAfterInserted = await this.insertData(dataInsertMessage);
						break;
				}

                if(!infoMessageAfterInserted)
                    return resolve({ error: true, message: "Can't create message", status: 403 });

				// UPDATE LAST MESSAGE
                let infoUpdateLastMessage = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessageAfterInserted._id, modifyAt: Date.now()
                }, { new: true });

                if(!infoUpdateLastMessage)
                    return resolve({ error: true, message: "Can't update last message", status: 403 });

				// UPDATE SHOW CONVERSATION HIDE
				await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$set: { usersHide: [] }
				}, { new: true });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID: senderID, numberMissMessage });

                return resolve({ error: false, data: infoMessageAfterInserted, status: 200 });
            } catch (error) {
				console.error(error)
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
				}).lean();

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
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
                }).lean();

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				if(filesID && !checkObjectIDs(filesID))
					return resolve({ error: true, message: "Request Params filesID Invalid", status: 400 });

				// Get list message will delete
				let listMessages = await CHATTING__MESSAGE_COLL
					.find({
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
							case 0: // Delete message normal (text message)
							case 6: // Delete message location
							case 7: // Delete message contact
								infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
									_id: message._id,
									conversation: conversationID
								}, {
									$addToSet: {
										usersDelete: userID
									}
								}, { new: true });
								break;
							case 1: // Delete message image
							case 2: // Delete message file

								if(!filesID || !filesID.length) {
									infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
										_id: message._id,
										conversation: conversationID
									}, {
										$addToSet: {
											usersDelete: userID
										}
									}, { new: true });
								} else {
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
								}

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
				// CHECK PARAMS
                if (!checkObjectIDs([...messagesID, userID, conversationID])) {
					return resolve({ 
						error: true, 
						message: 'Tham số không hợp lệ', 
						keyError: 'params_invalid',
						status: 400
					});
				}

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
                }).lean();

                if(!checkExistConversation) {
					return resolve({ 
						error: true, 
						message: 'Bạn không phải thành viên của cuộc hội thoại', 
						keyError: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				if(filesID && !checkObjectIDs(filesID)) {
					return resolve({ 
						error: true, 
						message: 'File ID không hợp lệ', 
						keyError: 'params_filesID_invalid',
						status: 400
					});
				}

				// Get list message will delete
				let listMessages = await CHATTING__MESSAGE_COLL
					.find({
						_id: { $in: messagesID },
						conversation: conversationID,
						sender: userID
					})
					.select('_id type createAt')
					.lean();

				if(!listMessages || !listMessages.length) {
					return resolve({ 
						error: true, 
						message: 'Tin nhắn không thuộc cuộc hội thoại này', 
						keyError: 'message_is_not_belong_conversation',
						status: 403
					});
				}

				// Get list message not expire recall
				let listMessagesNotExpire = [];
				listMessages.map(message => {
					const expireTime = new Date(message.createAt).addHours(1);
					const now 		 = new Date(Date.now());

					if(expireTime > now){
						listMessagesNotExpire[listMessagesNotExpire.length] = message;
					}
				})

				// Recall 1 message and message is expired recall
				if(messagesID.length === 1 && !listMessagesNotExpire.length) {
					return resolve({ 
						error: true, 
						message: 'Tin nhắn đã hết hạn thu hồi (1 tiếng)', 
						keyError: 'time_to_recall_messages_has_expired',
						status: 403
					});
				}

				const { results: infoMessageAfterUpdated } = await PromisePool
					.for(listMessagesNotExpire)
					.withConcurrency(2)
					.process(async message => {
						let infoMessageAfterUpdated = null;

						switch (message.type) {
							case 0: // Recall message normal (text message)
							case 6: // Recall message location
							case 7: // Recall message share contact
								infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndDelete(message._id);

								// Update last message for conversation
								let isLastMessage = checkExistConversation.lastMessage.toString() === message._id.toString();

								if(isLastMessage){
									let lastMessageOfConversation = await CHATTING__MESSAGE_COLL
										.findOne({ conversation: conversationID })
										.select('_id')
										.sort({ _id: -1 })

									await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
										$set: { lastMessage: lastMessageOfConversation._id }
									})
								}

								break;
							case 1: // Recall message images
							case 2: // Recall message files
								infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(message._id, {
									$pull: {
										files: {
											_id: { $in: filesID }
										}
									},
								}, { new: true });

								if(infoMessageAfterUpdated && !infoMessageAfterUpdated.files.length){
									await CHATTING__MESSAGE_COLL.findByIdAndDelete(message._id);
								}

								// infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
								// 	_id: message._id,
								// 	files: {
								// 		$elemMatch: {
								// 			file: { $in: filesID }
								// 		}
								// 	}
								// }, {
								// 	$set: {
								// 		"files.$.status": 2
								// 	}
								// }, { new: true });
								break;
							default:
								break;
						}

						return infoMessageAfterUpdated;
					})

				if(!infoMessageAfterUpdated || !infoMessageAfterUpdated.length) {
					return resolve({ 
						error: true, 
						message: 'Có lỗi xảy ra', 
						keyError: 'error_occurs',
						status: 422
					});
				}

				return resolve({ error: false, data: infoMessageAfterUpdated, status: 200 });
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Tự động xoá tất cả tin nhắn của cuộc hội thoại
	 * Date: 28/09/2021
	 */
	autoDeleteMessagesConversation({ conversationID, userID, time, isDelete = false, ctx }){
		return new Promise(async resolve => {
			try {
				// CHECK PARAMS
                if (!checkObjectIDs([userID, conversationID]))
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					authors: { $in: [userID] }
                }).lean();

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author conversation", status: 403 });

				if(isDelete){
					await CHATTING__MESSAGE_COLL.deleteMany({
						conversation: conversationID
					})
				} else{
					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.DELETE_JOB_AUTO_DELETE_MESSAGE_CONVERSATION}`, {
						conversationID
					});

					// !Off auto delete message
					if(+time !== 0){
						await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_AUTO_DELETE_MESSAGE_CONVERSATION}`, {
							conversationID,
							userID,
							time
						})
					}
				}

				resolve({ error: false, message: 'success', status: 200 });
			} catch (error) {
				resolve({ error: true, message: error.message, status: 500 });
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
				let listConversations = await CHATTING__CONVERSATION_COLL
					.find({
						_id: { $in: conversationsID },
						members: { $all: [userID] }
					})
					.select('_id members')
					.lean();

				if(!listConversations)
					return resolve({ error: true, message: "You aren't member of conversations", status: 403 });

				const { results } = await PromisePool
					.for(listConversations)
					.withConcurrency(2)
					.process(async conversation => {

						const values = await PromisePool
							.for(messagesID)
							.withConcurrency(2)
							.process(async messageID => {
								// Get info message share
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

								// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
								await this.updateUserMissMessage({ conversationID: conversation._id, userID, numberMissMessage: 1 });

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
				if(!checkObjectIDs([conversationID, messageID, userID])) {
					return resolve({ 
						error: true, 
						message: "Tham số không hợp lệ", 
						keyEror: 'params_conversationID_or_messageID_invalid',
						status: 400
					});
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

				// Check config admin conversation
				if(infoConversation.config && infoConversation.config.configPinMessage === 2){
					const listAuthorsID = infoConversation.authors.map(author => author.toString());
					// User is not author of conversation
					if(!listAuthorsID.includes(userID)) {
						return resolve({ 
							error: true, 
							message: "Bạn không có quyền pin tin nhắn", 
							keyEror: 'you_do_not_have_permission_to_pin_message',
							status: 403
						});
					}
				}

				let infoConversationAfterUpdate = null;
				let typeMessage = 0;

				if(isPin){

					if(infoConversation.messagesPin.includes(messageID)) {
						return resolve({ 
							error: true, 
							message: "Tin nhắn đã được pin", 
							keyEror: 'message_is_pined',
							status: 400
						});
					}

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

					typeMessage = 108; // Pin 1 tin nhắn trong cuộc hội thoại

				} else{
					infoConversationAfterUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$pull: { messagesPin: messageID }
					}, { new: true });

					typeMessage = 109; // Bỏ Pin 1 tin nhắn trong cuộc hội thoại
				}

				if(!infoConversationAfterUpdate) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				const infoMessageNotification = await this.insertData({
					conversation: conversationID,
					sender: userID,
					type: typeMessage,
					receivers: infoConversation.members,
				})

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({
					error: false, 
					data: {
						infoConversation: infoConversationAfterUpdate,
						infoMessage: infoMessageNotification
					}, 
					status: 200
				});
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
	getListMessagePinConversation({ conversationID, page, limit, userID, filter = {}, select = {} }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

                let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!infoConversation)
					return resolve({ error: true, message: "You aren't member of conversation", status: 403 });

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
					}, filter)
					.populate({
						path: 'poll',
						populate: {
							path: 'options.usersVote',
							select: '_id bizfullname fullname image'
						},
						select: select.poll
					})
					.populate('reminder', select.reminder)
					.populate('sender', select.sender)
					.populate({
						path: 'files.file',
						select: '_id file',
						populate: {
							path: 'file',
							select: select.file
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
						listRecords: listMessagesPined,
						currentPage: page,
						limit,
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
                if (!checkObjectIDs([userID, conversationID]) || !name || !options.length) {
					return resolve({ 
						error: true, 
						message: "Tham số không hợp lệ", 
						keyEror: 'params_invalid',
						status: 400
					});
				}

				// CHECK USER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                }).lean();

                if(!checkExistConversation) {
					return resolve({ 
						error: true, 
						message: "Bạn không phải thành viên của cuộc hội thoại", 
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				// Check config admin conversation
				if(checkExistConversation.config && checkExistConversation.config.configCreatePoll === 2){
					const listAuthorsID = checkExistConversation.authors.map(author => author.toString());
					// User is not author of conversation
					if(!listAuthorsID.includes(userID)) {
						return resolve({ 
							error: true, 
							message: "Bạn không có quyền tạo poll", 
							keyEror: 'you_do_not_have_permission_to_create_poll',
							status: 403
						});
					}
				}

				// INSERT MESSAGE POLL
				let infoPollAfterInsert = await CHATTING__MESSAGE_POLL_COLL.create({
					name,
					options
				})

				if(!infoPollAfterInsert) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				let dataInsertMessage = {
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					poll: infoPollAfterInsert._id,
				}

				// INSERT MESSAGE NOTIFY CREATE POLL
				// await this.insertData({
				// 	...dataInsertMessage,
				// 	type: 110
				// })

				// INSERT MESSAGE POLL
				let infoMessagePoll = await this.insertData({
					...dataInsertMessage,
					type: 5
				})

				if(!infoMessagePoll) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

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
					data: infoMessagePoll
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
				if (!checkObjectIDs([messageID, userID, conversationID])) {
					return resolve({ 
						error: true, 
						message: "Tham số không hợp lệ", 
						keyEror: 'params_messageID_or_conversationID_invalid',
						status: 400
					});
				}

				// CHECK USER IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation) {
					return resolve({ 
						error: true, 
						message: "Bạn không phải thành viên của cuộc hội thoại", 
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				let infoMessagePoll = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id poll')
					.populate('poll');

				if(!infoMessagePoll || !infoMessagePoll.poll) {
					return resolve({ 
						error: true, 
						message: "Tin nhắn không tồn tại", 
						keyEror: 'message_is_not_exists',
						status: 400
					});
				}

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
						type: 111 // Tham gia bình chọn trong cuộc hội thoại
					})
					numberMissMessage++;
				}

				// INSERT MESSAGE NOTIFY CHANGE VOTE POLL
				if((votesCancel.length || newVotes.length || newOptions.length) && !isFirstTimeVote){
					lastMessage = await this.insertData({
						...dataInsertMessage,
						type: 112 // Thay đổi bình chọn trong cuộc hội thoại
					})
					numberMissMessage++;
				}

				let infoMessagePollAfterUpdate = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate({
						path: 'poll',
						populate: {
							path: 'options.usersVote',
							select: '_id bizfullname fullname image'
						}
					})
					.lean();

				if(!infoMessagePollAfterUpdate) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				// UPDATE LAST MESSAGE
				if(lastMessage){
					let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: lastMessage._id, modifyAt: Date.now()
					}, { new: true });

					if(!checkLastMessageAfterUpdated) {
						return resolve({ 
							error: true, 
							message: "Không thể cập nhật tin nhắn mới nhất", 
							keyEror: 'cannot_update_last_message',
							status: 422
						});
					}
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage });

				return resolve({
					error: false,
					status: 200,
					data: {
						infoMessage: infoMessagePollAfterUpdate,
						infoMessageNotification: lastMessage
					}
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
				if (!checkObjectIDs([messageID, userID, conversationID])) {
					return resolve({ 
						error: true, 
						message: "Tham số message ID hoặc conversation ID không hợp lệ", 
						keyEror: 'params_messageID_or_conversationID_invalid',
						status: 400
					});
				}

				// CHECK USER IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation) {
					return resolve({ 
						error: true, 
						message: "Bạn không phải thành viên của cuộc hội thoại", 
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				let infoMessagePoll = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id poll')
					.populate('poll');

				if(!infoMessagePoll || !infoMessagePoll.poll) {
					return resolve({ 
						error: true, 
						message: "Tin nhắn không tồn tại", 
						keyEror: 'message_is_not_exists',
						status: 400
					});
				}

				let { poll } = infoMessagePoll;

				if(poll.status === 2) {
					return resolve({ 
						error: true, 
						message: "Tin nhắn poll đã được đóng", 
						keyEror: 'message_poll_is_closed',
						status: 400
					});
				}

				const infoPoll = await CHATTING__MESSAGE_POLL_COLL.findByIdAndUpdate(poll._id, {
					$set: {
						status: 2
					}
				}, { new: true });

				if(!infoPoll) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				// INSERT MESSAGE NOTIFY CLOSE POLL
				const lastMessage = await this.insertData({
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					poll: poll._id,
					type: 113
				})

				// UPDATE LAST MESSAGE
				if(lastMessage){
					let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: lastMessage._id, modifyAt: Date.now()
					}, { new: true });

					if(!checkLastMessageAfterUpdated) {
						return resolve({ 
							error: true, 
							message: "Không thể cập nhật tin nhắn mới nhất", 
							keyEror: 'cannot_update_last_message',
							status: 422
						});
					}
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({
					error: false,
					status: 200,
					data: {
						infoPoll,
						infoMessageNotification: lastMessage
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
	getListMessagePoll({ conversationID, lastestID, userID, limit = 10, filter = {}, select = {} }) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(isNaN(limit)){
					limit = 10;
				} else{
					limit = +limit;
				}

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

				let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!infoConversation)
					return resolve({ error: true, message: "You aren't member of conversation ", status: 403 });

				let conditionFind = {};
				let conditionObj  = {
					conversation: conversationID,
					type: 5
				};
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
				}

				// GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoMessage = await CHATTING__MESSAGE_COLL.findById(lastestID);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 403 });

					let nextInfo = `${infoMessage.modifyAt}_${infoMessage._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}
				
				let	listMessagesPoll = await CHATTING__MESSAGE_COLL
					.find({ ...conditionObj, ...conditionFind }, filter)
					.populate('sender', select.sender)
					.populate({
						path: 'poll',
						populate: {
							path: 'options.usersVote',
							select: '_id bizfullname fullname image'
						},
						select: select.poll
					})
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				if(!listMessagesPoll)
					return resolve({ error: true, message: "Can't get list message poll", status: 403 });

				// GET TOTAL RECORD
				let totalRecord = await CHATTING__MESSAGE_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listMessagesPoll && listMessagesPoll.length){

					if(listMessagesPoll.length > limit){
						nextCursor = listMessagesPoll[limit - 1]._id;
						listMessagesPoll.length = limit;
					}

				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listMessagesPoll,
						limit: +limit,
						totalRecord,
						nextCursor
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
                }).lean();

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				// Check config admin conversation
				if(checkExistConversation.config && checkExistConversation.config.configCreateNote === 2){
					const listAuthorsID = checkExistConversation.authors.map(author => author.toString());
					// User is not author of conversation
					if(!listAuthorsID.includes(userID))
						return resolve({ error: true, message: "You don't have permission to create note or reminder conversation", status: 403 });
				}

				// INSERT MESSAGE REMINDER
				let infoReminderAfterInsert = await CHATTING__MESSAGE_REMINDER_COLL.create({
					content,
					notifyFor,
					remindTime: new Date(remindTime),
					repeat
				})

				if(!infoReminderAfterInsert) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				let dataInsertMessage = {
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: infoReminderAfterInsert._id
				}

				// INSERT MESSAGE NOTIFY CREATE REMINDER
				// await this.insertData({
				// 	...dataInsertMessage,
				// 	type: 114
				// })

				// INSERT MESSAGE REMINDER
				let infoMessageReminder = await this.insertData({
					...dataInsertMessage,
					type: 4
				})

				// UPDATE LAST MESSAGE
                let infoUpdateLastMessage = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessageReminder._id, modifyAt: Date.now()
                }, { new: true });

				if(!infoUpdateLastMessage)
					return resolve({ error: true, message: "Can't update last message", status: 403 });

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 2 });

				// ADD JOB FOR REMINDER
				await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_REMINDER_CONVERSATION}`, {
					messageID: infoMessageReminder._id.toString(),
					conversationID,
					userID,
					remindTime,
					repeat,
					notifyFor
				})

				return resolve({
					error: false,
					status: 200,
					data: infoMessageReminder
				});
			} catch(error){
				console.error(error);
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật tin nhắn nhắc hẹn trong cuộc hội thoại
	 * Date: 01/09/2021
	 */
	updateMessageReminder({ conversationID, messageID, content, remindTime, repeat, userID, ctx }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([userID, conversationID, messageID]))
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				if(!REMINDER_REPEAT.includes(repeat))
					return resolve({ error: true, message: 'Request Params repeat invalid', status: 400 });

				if(!moment(remindTime).isValid())
					return resolve({ error: true, message: 'Request Params remindTime invalid', status: 400 });

				// CHECK USER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                }).lean();

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

				if(!infoReminderAfterUpdate) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				// INSERT MESSAGE NOTIFY UPDATE REMINDER
				let infoMessageNotify = await this.insertData({
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: reminder._id,
					type: 115
				})

				// UPDATE LAST MESSAGE
				if(infoMessageNotify) {
					let infoUpdateLastMessage = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: infoMessageNotify._id, modifyAt: Date.now()
					}, { new: true });
	
					if(!infoUpdateLastMessage) {
						return resolve({ 
							error: true, 
							message: "Không thể cập nhật tin nhắn mới nhất", 
							keyEror: 'cannot_update_last_message',
							status: 422
						});
					}
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				if(remindTime){
					// REMOVE OLD REMINDER JOB
					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.DELETE_JOB_REMINDER_CONVERSATION}`, {
						messageID,
						conversationID,
					})

					// ADD JOB FOR REMINDER
					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_REMINDER_CONVERSATION}`, {
						messageID,
						conversationID,
						userID,
						remindTime,
						repeat
					})
				}

				const infoMessage = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate({
						path: 'sender receivers usersAssigned',
						select: '_id fullname bizfullname image'
					})
					.populate({
						path: 'reminder',
						populate: {
							path: 'accepts rejects',
							select: '_id bizfullname fullname image'
						}
					})
					.lean();

				return resolve({
					error: false,
					status: 200,
					data: {
						infoMessage: infoMessage,
						infoMessageNotification: infoMessageNotify
					}
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
                if (!checkObjectIDs([userID, conversationID, messageID])) {
					return resolve({ 
						error: true, 
						message: "Tham số conversation ID hoặc message ID không hợp lệ", 
						keyEror: 'params_conversationID_or_messageID_invalid',
						status: 422
					});
				}

				// CHECK USER IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
                }).lean();

                if(!checkExistConversation) {
					return resolve({ 
						error: true, 
						message: "Bạn không phải thành viên của cuộc hội thoại", 
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				let infoMessageReminder = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate('reminder');

				if(!infoMessageReminder || !infoMessageReminder.reminder) {
					return resolve({ 
						error: true, 
						message: "Tin nhắn không tồn tại", 
						keyEror: 'message_is_not_exists',
						status: 400
					});
				}

				let { reminder } 			= infoMessageReminder;
				let infoReminderAfterUpdate = null;
				let typeMessage 			= 0;

				// USER JOIN REMINDER
				if(isJoin){
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

					typeMessage = 117; // Xác nhận không tham gia nhắc hẹn
				}

				if(!infoReminderAfterUpdate) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				// INSERT MESSAGE NOTIFY UPDATE USER JOIN REMINDER
				let infoMessageNotify = await this.insertData({
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: reminder._id,
					type: typeMessage
				})

				// UPDATE LAST MESSAGE
                let updateLastMessage = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: infoMessageNotify._id, modifyAt: Date.now()
                }, { new: true });

				if(!updateLastMessage) {
					return resolve({ 
						error: true, 
						message: "Không thể cập nhật tin nhắn mới nhất", 
						keyEror: 'cannot_update_last_message',
						status: 422
					});
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({
					error: false,
					status: 200,
					data: {
						infoReminder: infoReminderAfterUpdate,
						infoMessageNotification: infoMessageNotify
					}
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
	deleteReminder({ conversationID, messageID, userID, ctx }) {
		return new Promise(async resolve => {
			try {
				if (!checkObjectIDs([messageID, userID, conversationID])) {
					return resolve({ 
						error: true, 
						message: "Tham số conversation ID hoặc message ID không hợp lệ", 
						keyEror: 'params_conversationID_or_messageID_invalid',
						status: 400
					});
				}

				// CHECK USER IS MEMBER OF CONVERSATION
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation) {
					return resolve({ 
						error: true, 
						message: "Bạn không phải thành viên của cuộc hội thoại", 
						keyEror: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				let infoMessageReminder = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.select('_id reminder')
					.populate('reminder');

				if(!infoMessageReminder || !infoMessageReminder.reminder) {
					return resolve({ 
						error: true, 
						message: "Tin nhắn không tồn tại", 
						keyEror: 'message_is_not_exists',
						status: 400
					});
				}

				let { reminder } = infoMessageReminder;

				if(reminder.status === 2) {
					return resolve({ 
						error: true, 
						message: "Reminder đã bị xóa", 
						keyEror: 'reminder_is_deleted',
						status: 403
					});
				}

				const infoReminderAfterDelete = await CHATTING__MESSAGE_REMINDER_COLL.findByIdAndUpdate(reminder._id, {
					$set: {
						status: 2
					}
				}, { new: true });

				if(!infoReminderAfterDelete) {
					return resolve({ 
						error: true, 
						message: "Đã xảy ra lỗi", 
						keyEror: 'error_occurred',
						status: 422
					});
				}

				// REMOVE OLD REMINDER JOB
				await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.DELETE_JOB_REMINDER_CONVERSATION}`, {
					messageID,
					conversationID
				})

				// INSERT MESSAGE NOTIFY DELETE REMINDER
				const infoMessageNotify = await this.insertData({
					usersSeen: [userID],
					sender: userID,
					conversation: conversationID,
					receivers: checkExistConversation.members,
					reminder: reminder._id,
					type: 118
				})

				// UPDATE LAST MESSAGE
				if(infoMessageNotify){
					let infoUpdateLastMessage = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						lastMessage: infoMessageNotify._id, modifyAt: Date.now()
					}, { new: true });

					if(!infoUpdateLastMessage) {
						return resolve({ 
							error: true, 
							message: "Không thể cập nhật tin nhắn mới nhất", 
							keyEror: 'cannot_update_last_message',
							status: 422
						});
					}
				}

				// UPDATE AMOUNT MESSAGE USER MISS IN CONVERSATION
				await this.updateUserMissMessage({ conversationID, userID, numberMissMessage: 1 });

				return resolve({
					error: false,
					status: 200,
					data: {
						infoReminder: infoReminderAfterDelete,
						infoMessageNotification: infoMessageNotify
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Danh sách tin nhắn nhắc hẹn trong cuộc hội thoại
	 * Date: 02/09/2021
	 */
	getListMessageReminder({ conversationID, lastestID, userID, limit = 10, filter = {}, select = {} }) {
		return new Promise(async (resolve) => {
			try {
				if(!checkObjectIDs([userID])) {
					return resolve({ 
						error: true, 
						message: 'Tham số user ID', 
						keyError: 'params_userID_invalid',
						status: 400
					});
				}

				if(isNaN(limit)) {
					limit = 10;
				} else{
					limit = +limit;
				}

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

				let conditionFind = {};
				let conditionObj  = { type: 4 };
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
				}

				if(conversationID && checkObjectIDs([conversationID])) {
					let infoConversation = await CHATTING__CONVERSATION_COLL.findOne({
						_id: conversationID,
						members: { $in: [userID] }
					}).lean();

					if(!infoConversation) {
						return resolve({ 
							error: true, 
							message: 'Bạn không phải thành viên của cuộc hội thoại', 
							keyError: 'you_are_not_member_of_conversation',
							status: 403
						});
					}

					conditionObj.conversation = conversationID;
				}

				// GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoMessage = await CHATTING__MESSAGE_COLL.findById(lastestID);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 403 });

					let nextInfo = `${infoMessage.modifyAt}_${infoMessage._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

				let	listMessagesReminder = await CHATTING__MESSAGE_COLL
					.find({ ...conditionObj, ...conditionFind }, filter)
					.populate('sender', select.sender)
					.populate({
						path: 'reminder',
						populate: {
							path: 'accepts rejects',
							select: select.user,
						},
						select: select.reminder
					})
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await CHATTING__MESSAGE_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listMessagesReminder && listMessagesReminder.length){
					if(listMessagesReminder.length > limit){
						nextCursor = listMessagesReminder[limit - 1]._id;
						listMessagesReminder.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listMessagesReminder,
						limit: +limit,
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
	 * Func: Reaction tin nhắn trong cuộc hội thoại
	 * Date: 26/10/2021
	 */
	reactionMessage({ userID, messageID, typeReaction, ctx }){
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
						message: 'Request params message ID or user ID invalid', 
						keyError: 'params_messageID_or_userID_invalid',
						status: 400
					});
				}

				const infoMessage = await CHATTING__MESSAGE_COLL
					.findById(messageID)
					.populate('reactions')
					.lean();

				// Check Already reaction
				const infoReaction = infoMessage?.reactions?.find(reaction => 
					userID.toString() === reaction.userCreate.toString()
				);

				if(infoReaction && +infoReaction.type === typeReaction){
					const infoAfterDeleteReaction = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
						$pull: {
							reactions: infoReaction._id
						}
					}, { new: true });

					return resolve({
						error: false,
						status: 200,
						data: infoAfterDeleteReaction
					});
				}

				let infoAfterInsertReaction = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION_CORE_INSERT}`, {
					type: typeReaction,
					userID
				});

				if(infoAfterInsertReaction.error)
					return resolve(infoAfterInsertReaction);

				if(infoReaction) {
					await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
						$pull: {
							reactions: infoReaction._id
						}
					});
				}

				const infoAfterUpdateReaction = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
					$addToSet: {
						reactions: infoAfterInsertReaction?.data?._id
					}
				}, { new: true });

				if(!infoAfterUpdateReaction)
                    return resolve({ error: true, message: "Can't reaction message", status: 422 });

                return resolve({ error: false, data: infoAfterUpdateReaction, status: 200 });
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
						message: 'Request params message ID or user ID invalid', 
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

				if(!infoMessage)
					return resolve({ error: true, message: "Can't get info message", status: 403 });

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: infoMessage.reactions,
						totalRecord: infoMessage.reactions.length,
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, keyError: 'server_error', status: 500 })
			}
		})
	}

}

exports.MODEL = new Model;
