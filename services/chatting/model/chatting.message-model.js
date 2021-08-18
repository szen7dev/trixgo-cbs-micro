"use strict";

/**
 * EXTERNAL PACKAGE
 */
const fs                                            = require('fs');
const path                                          = require('path');
const PromisePool									= require('@supercharge/promise-pool');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION }                     = require('../../../tools/cursor_base/playground/index');
const { calculateCurrentPage } 						= require('../../../tools/utils/calculate_current_page');
const { 
	objectID, 
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
const FILE__FILE_COLL                               = {};

/**
 * MODELS
 */
const CHATTING__CONVERSATION_FILE_MODEL				= require('../model/chatting.conversation_file-model').MODEL;


class Model extends BaseModel {

    constructor() {
        super(CHATTING__MESSAGE_COLL);
    }

    // Thêm tin nhắn mới (cũ -> dùng hàm bên dưới để insert message)
    insert({ senderID, content, parentID, receivers, conversationID, status = 0, type = 0 }) { 
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
                    if(receiver && !checkObjectIDs(receiver))
                        return resolve({ error: true, message: 'Params invalid' });
                })

                if(!Array.isArray(arrReceiver))
                    return resolve({ error: true, message: 'Params invalid' });

                // kiểm tra các receivers có phải là members trong cuộc hội thoại
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({
					_id: conversationID,
					members: { $all: [senderID, ...arrReceiver] }
                });
                if(!Array.isArray(checkExistConversation) || checkExistConversation.length < 1)
                    return resolve({ error: true, message: 'You are not member', status: 403 });

                let infoMessageAfterInserted = null;

                // Kiểm tra parentID => tính năng reply tin nhắn
                if(parentID) {
                    if(parentID && !checkObjectIDs(parentID)) 
                        return resolve({ error: true, message: 'Params invalid' });

                    infoMessageAfterInserted = await that.insertData({ 
						listSeen: [senderID], 
						sender: senderID, 
						content, 
						conversation: conversationID, 
						parent: parentID, 
						status, 
						type
					});

                    if(!infoMessageAfterInserted)
                        return resolve({ error: true, message: 'Cant create message reply', status: 403 });

                    await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        lastMessage: infoMessageAfterInserted._id, modifyAt: Date.now()
                    }, { new: true });

                    return resolve({ error: false, data: infoMessageAfterInserted, status: 200 });
                }

                infoMessageAfterInserted = await that.insertData({
					listSeen: [senderID], 
					sender: senderID, 
					content, 
					conversation: conversationID, 
					parent: parentID, 
					status, 
					type
				});

                if(!infoMessageAfterInserted)
                    return resolve({ error: true, message: 'Cant create message ', status: 403 });

                let { _id: messageID } = infoMessageAfterInserted; 
                let infoMessageAfterUpdated = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, {
                    $addToSet: {
                        receivers: [...arrReceiver]
                    }
                }, { new: true });

                if(!infoMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant create message ', status: 403 });

                let checkLastMessageAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    lastMessage: messageID, modifyAt: Date.now()
                }, { new: true });

                if(!checkLastMessageAfterUpdated)
                    return resolve({ error: true, message: 'Cant create message', status: 403 });

                return resolve({ error: false, data: infoMessageAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn trong cuộc hội thoại (text, emoij, tag name)
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
							listSeen: [senderID],
							sender: senderID, 
							receivers: receiversID,
							content: link, 
							conversation: conversationID,
							type: 3
						}))

						await PromisePool
							.for(listMessageLinks)
							.withConcurrency(2)
							.process(async message => this.insertData(message))
					}
				}

				// INSERT MESSAGE
                let infoMessageAfterInserted = await this.insertData(dataInsertMessage);

                if(!infoMessageAfterInserted)
                    return resolve({ error: true, message: "Can't create message", status: 403 });

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



	/**
	 * Dev: VinhHV
	 * Func: Lấy toàn bộ các tin nhắn trong cuộc hội thoại (phân trang)
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
    getMessageByConversationIDWithPage({ conversationID, userID, latestMessageID }){
        return new Promise(async resolve => {
            try {
                let page 	= 1;
                let perPage = 15;

                if(latestMessageID && checkObjectIDs(latestMessageID)){
                    page = 2;
                }

				// Check params
                if(page === 1 && !checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

                if(page === 2 && !checkObjectIDs([conversationID, userID, latestMessageID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
                let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({
                    _id: conversationID,
                    members: { $all: [userID] }
                }).lean();

                if(!checkExistConversation)
                    return resolve({ error: true, message: "Can't get list message in conversation", status: 403 });

				// Get info last message in conversation (limit 15 per list message)
                let conditionObj = {};
				let _sort = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
				};

                if(page === 2){
                    let infoMessage = await CHATTING__MESSAGE_COLL.findById(latestMessageID);
                    if(!infoMessage)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoMessage.createAt}_${infoMessage._id}`;

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys: ['createAt__-1', '_id__-1'] });
					if(!dataPagingAndSort || (dataPagingAndSort && dataPagingAndSort.error) )
						return resolve({ error: true, message: "Request params nextInfo invalid", status: 400 });

					conditionObj   = dataPagingAndSort.data.find;
					_sort          = dataPagingAndSort.data.sort;
                }
				conditionObj.conversation = objectID(conversationID);

                let listMessage = await CHATTING__MESSAGE_COLL.find(conditionObj)
                    // .populate({ 
                    //     path: 'files',
                    // })
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
					.sort(_sort)
					.lean();

                let totalPagePromise         = CHATTING__MESSAGE_COLL.count({ conversation: conversationID });
                let totalCheckExPagePromise  = CHATTING__MESSAGE_COLL.count(conditionObj);

				const { currentPage, totalPage } = await calculateCurrentPage({
					totalPagePromise: totalPagePromise,
					totalCurrentPagePromise: totalCheckExPagePromise,
					perPage
				})

                return resolve({ 
					error: false,
					status: 200,
					data: { 
						listMessage,
						perPage,
						currentPage,
						totalPage
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


    // coppy tin nhắn
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

    // GetFiles
    getFiles({ conversationID, currentPage, userID }){
        return new Promise(async(resolve)=>{
            try {
                const page = Number(currentPage) || 1;
                const perPage = 5;
                if(!checkObjectIDs(conversationID))
                    return resolve({ error: true, message: 'Params invalid' });

                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.find({
                        _id: conversationID ,
                        members: { $all: [userID] }
                });

                if(currentPage ==1){
                    let listImage = await FILE__FILE_COLL.find({ conversation: conversationID, type : 1 })
                        .skip((page * perPage) - perPage)
                        .limit(perPage)
                        .sort({ createAt: -1 });
                    
                    let listZips = await FILE__FILE_COLL.find({ conversation: conversationID, type : 3 })
                        .skip((page * perPage) - perPage)
                        .limit(perPage)
                        .sort({ createAt: -1 });

                    return resolve({ error: false, data : {listImage, listZips}, page });
                }else{

                    let listImage = await FILE__FILE_COLL.find({ conversation: conversationID, type : 1 })
                        .sort({ createAt: -1 });
                
                    let listZips = await FILE__FILE_COLL.find({ conversation: conversationID, type : 3 })
                        .sort({ createAt: -1 });
                        
                    return resolve({ error: false, data : {listImage, listZips}, status : 200 });

                }
            
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // xóa toàn bộ các tin nhắn trong cuộc hội thoại
    removeAllByConversationID({ conversationID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID))
                    return resolve({ error: true, message: 'Params invalid' });

                let infoMessageAfterRemoved = await CHATTING__MESSAGE_COLL.find({ conversation: conversationID});
                if(!infoMessageAfterRemoved)
                    return resolve({ error: true, message : 'cannot_remove'});
                
                infoMessageAfterRemoved.forEach(async message=>{
                    let infoMessage = await CHATTING__MESSAGE_COLL.findById(message._id);
                    let infoMessageAfterRemoved = await CHATTING__MESSAGE_COLL.findOneAndRemove({ _id: message._id, conversation: conversationID });
                    if(!infoMessageAfterRemoved)
                        return resolve({ error: true, message : 'cannot_remove' });
    
                    let pathFileMessage = path.resolve(__dirname, '../../../..');
                    await infoMessage.files.forEach(async file=>{
                        let info = await FILE__FILE_COLL.findById(file);
                        await FILE__FILE_COLL.findByIdAndDelete(file)
                        fs.unlink(`${pathFileMessage}${info.url}`, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })
                    })
                })

                return resolve({ error: false, data : '' });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }


    getInfoByID({ messageID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'object_invalid' });

                let infoMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                    // .populate({ 
                    //     path: 'files',
                    // })
                    // .populate({
                    //     path: 'parent',
                    //     populate: {
                    //         path: "files"
                    //     },
                    //     populate : { 
                    //         path : 'sender', select :  '_id fullname  image' 
                    //     }
                    // })
                    // .populate({path : 'sender', select :  '_id fullname  image' })
                    // .populate({path : 'listSeen', select :  '_id fullname  image' })
                    // .populate({
                    //     path: 'reactions',
                    //     populate: {
                    //         path: "author"
                    //     }
                    // });

                if(!infoMessage)
                    return resolve({ error: true, message: 'cannot_find' });

                //Chưa check xóa tin nhắn có files_ và tin nhắn có tin nhắn reply
                return resolve({ error: false, data: infoMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    //cập nhật trạng thái tin nhắn đã xem
    /**
     * Author: Vinh
     * Update: Hoang - 3:35PM - 21/10/2020
     * add seen for like (status = 107)
     */
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

    // Tìm kiếm tin theo nội dung dạng string
    getInfoWithKey({ key, conversationID, userID }) {
        return new Promise(async resolve => {
            try {
                let checkExitsConversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID,
                    members: { $in: [userID]},
                });
                if(!checkExitsConversation)
                    return resolve({ error: true, message :'exit conversation' });

                let infoMessage = await CHATTING__MESSAGE_COLL.find({
                    conversation: conversationID,
                        $or: [
                            { content: new RegExp(key, 'i') }
                        ]
                })

                // lấy những tin nhắn gần nhất nên sẽ lấy phần tử cuối cùng tìm được
                infoMessage = infoMessage[infoMessage.length -1]
                return resolve({ error: false, data: infoMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // thay đổi trạng thái đã nhận tin nhắn phía người nhận
    /**
     * Author: Vinh
     * Update: Hoang - 2:55PM 22/10/2020 
     * check message.status < 100 to set status again. 
     */
    updateReceive({ messageID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(messageID))
                    return resolve({ error: true, message: 'Params invalid' });

                // status = 2 trạng thái đã nhận tin nhắn, tin nhắn đã gửi thành công
                let infoMessage = await CHATTING__MESSAGE_COLL.findById(messageID);
                if(!infoMessage)
                    return resolve({ error: true, message: 'Message is exits', status: 403 });

                if(infoMessage.status < 100){
                    let infoMessageAfterUpdate = await CHATTING__MESSAGE_COLL.findByIdAndUpdate(messageID, 
						{ status: 2 }, { new: true }
					);

                    if(!infoMessageAfterUpdate)
                        return resolve({ error: true, message: 'Message is exits', status: 403 });

                    return resolve({ error: false, data: infoMessageAfterUpdate, status: 200 });
                }

				return resolve({ 
					error: false, 
					data: "message_status_greater_than_100", 
					message: 'message_status_greater_than_100', 
					status: 200 
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        });
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


    // Xuất báo cáo từ cuộc hội thoại
}

exports.MODEL = new Model;