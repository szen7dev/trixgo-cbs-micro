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
    insertMessage({ senderID, content, receiversID, conversationID, membersAssigned, files, type = 0, ctx }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs([senderID, conversationID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

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
                    	return resolve({ error: true, message: 'Request Params invalid', status: 400 });
				}

				let dataInsertMessage = {
					listSeen: [senderID], 
					sender: senderID, 
					content, 
					conversation: conversationID,
					receivers: receiversID,
					type
				}

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
	deleteMessage({ conversationID, userID, messagesID, typeMessage, filesID }) {
        return new Promise(async (resolve) => {
            try {
				if(!typeMessage || isNaN(typeMessage))
					return resolve({ error: true, message: 'Request Params invalid', status: 400 });

                if (!checkObjectIDs([...messagesID, userID, conversationID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USERID IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({
					_id: conversationID,
					members: { $all: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				let infoMessageAfterUpdated = null;
				switch (+typeMessage) {
					case 0: // Xoá tin nhắn thông thường (text message)

						infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
							_id: { $in: messagesID },
							conversation: conversationID
						}, {
							$push: {
								usersDelete: userID
							}
						}, { new: true });

						break;
					case 1: // Xoá tin nhắn image, file (media message)
					case 2:

						if(!filesID || !filesID.length)
							return resolve({ error: true, message: "Request Params Invalid", status: 400 });

						if(!checkObjectIDs(filesID))
							return resolve({ error: true, message: "Request Params Invalid", status: 400 });

						infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
							_id: { $in: messagesID },
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
	revokeMessage({ conversationID, userID, messagesID, typeMessage, filesID }) {
        return new Promise(async (resolve) => {
            try {
				if(!typeMessage || isNaN(typeMessage))
					return resolve({ error: true, message: 'Request Params invalid', status: 400 });

                if (!checkObjectIDs([...messagesID, userID, conversationID])) 
                    return resolve({ error: true, message: 'Request Params invalid', status: 400 });

				// CHECK USERID IS MEMBER OF CONVERSATION
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({
					_id: conversationID,
					members: { $all: [userID] }
                });

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't member", status: 403 });

				let infoMessageAfterUpdated = null;
				switch (+typeMessage) {
					case 0: // Thu hồi tin nhắn thông thường (text message)

						infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
							_id: { $in: messagesID },
							conversation: conversationID,
							sender: userID
						}, {
							$set: { status: 3 }
						}, { new: true });

						break;
					case 1: // Thu hồi tin nhắn ảnh (media message)
					case 2:

						if(!filesID || !filesID.length)
							return resolve({ error: true, message: "Request Params Invalid", status: 400 });

						if(!checkObjectIDs(filesID))
							return resolve({ error: true, message: "Request Params Invalid", status: 400 });

						infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findOneAndUpdate({
							_id: { $in: messagesID },
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

				if(!infoMessageAfterUpdated)
					return resolve({ error: true, message: "Can't revoke message", status: 403 });

				return resolve({ error: false, data: infoMessageAfterUpdated, status: 200 });
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}





    // copy tin nhắn
    copyMessage({ senderID, receivers, conversationID, messageShareID }) { 
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs(senderID, conversationID)) 
                    return resolve({ error: true, message: 'Params invalid' });    

                let arrReceiver = receivers;
                // if(receivers && receivers.includes(',')) {
                //     arrReceiver = receivers.split(',');
                // } else {
                //     arrReceiver.push(receivers);
                // }
                arrReceiver.forEach(receiver =>{
                    if(!checkObjectIDs(receiver))
                        return resolve({ error: true, message: 'Params invalid' });
                })
                if(!Array.isArray(arrReceiver))
                    return resolve({ error: true, message: 'Params invalid' });

                
                // kiểm tra các receivers có phải là members trong cuộc hội thoại
                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
                        _id: conversationID ,
                        members: { $all: [senderID, ... arrReceiver] }
                });
                if(!Array.isArray(checkExistConversation) || checkExistConversation.length < 1)
                    return resolve({ error: true, message: 'You are not member', status : 403 });

                let infoMessageAfterInserted;
                let infoMessageShare = await CHATTING__MESSAGE_COLL.findById(messageShareID);
            
                let _infoMessageShare = {};
                _infoMessageShare.files         = infoMessageShare.files
                _infoMessageShare.content       = infoMessageShare.content
                _infoMessageShare.conversation  = conversationID;
                _infoMessageShare.sender        = senderID;
                _infoMessageShare.receivers     = arrReceiver;


                _infoMessageShare.status     = 3;
                infoMessageAfterInserted = await that.insertData(_infoMessageShare);
                if(!infoMessageAfterInserted)
                    return resolve({ error: true, message: 'Cant create message ', status : 403 });

                let { _id: messageID } = infoMessageAfterInserted; 
                let infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
                    $addToSet: {
                        receivers: [...arrReceiver]
                    }
                }, { new: true });

                if(!infoMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant create message ', status : 403 });

                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: messageID, modifyAt: Date.now()
                }, { new: true });

                if(!checkLastMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant update to last message ', status : 403 });
                
                return resolve({ error: false, data : infoMessageAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
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

    // db.products.find({_id: {$gt: ObjectId("4fdbaf608b446b0477000142") }}).limit(1)
    // lấy tin nhắn trước và sau tin nhắn hiện tại ví dụ  [ tn1  tn2 tn3 tn4 tn5] truyền vào tìm tn2 sẽ lấy ra tn1 tn2 tn3
    getMessagefromAPoint({ messageID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'object_invalid'});
                // status = 2 trạn thái đã nhận tin nhắn , tin nhắn đã gửi thành công
                let infoMessage = await CHATTING__MESSAGE_COLL.find({ _id: messageID });
                let conversationID = infoMessage[0].conversation;
                //.sort({createAt: -1})
                let listData  =  [];
            
                let infoMessage1 = await CHATTING__MESSAGE_COLL.find({_id: { $lte: messageID }, conversation : conversationID})
                    .populate({
                        path : 'sender',
                        populate : {
                            path : 'company'
                        }
                    })
                    .populate({
                        path : 'userFixedBug',
                        populate : {
                        path : 'company'
                        }
                    })
                    .populate({
                        path : 'conversation',
                        select :  '_id name' 
                    })
                    .populate({
                        path : 'files',
                        select :  'path _id type' 
                    })
                    .populate({
                        path : 'listSeen',
                        select :  'fullname _id email image' 
                    })
                    .populate({
                        path : 'app',
                        select :  '_id name' 
                    }).limit(3).sort({createAt: -1})

                let infoMessage2 = await CHATTING__MESSAGE_COLL.find({ _id: { $gte: messageID }, conversation : conversationID})
                    .populate({
                        path : 'sender',
                        populate : {
                            path : 'company'
                        }
                    })
                    .populate({
                        path : 'userFixedBug',
                        populate : {
                        path : 'company'
                        }
                    })
                    .populate({
                        path : 'conversation',
                        select :  '_id name' 
                    })
                    .populate({
                        path : 'files',
                        select :  'path _id type' 
                    })
                    .populate({
                        path : 'listSeen',
                        select :  'fullname _id email image' 
                    })
                    .populate({
                        path : 'app',
                        select :  '_id name' 
                    }).limit(3)

                if(!infoMessage2 && !infoMessage1)
                    return resolve({ error: true, data: 'cant_get_message' });

                if(infoMessage1){
                    infoMessage1.reverse();
                    listData = listData.concat(infoMessage1)
                }

                if(infoMessage2){
                    listData = listData.concat(infoMessage2)
                }
                listData = [...new Set(listData)];

                
                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

}

exports.MODEL = new Model;