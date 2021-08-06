"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  = require('mongoose').Types.ObjectId;

/**
 * TOOLS
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 				= require('../../../tools/cursor_base/playground/index');
const { calculateCurrentPage } 					= require('../../../tools/utils/calculate_current_page');
const { checkObjectIDs } 						= require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.conversation-coll');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');
const FILE__FILE_COLL                           = {};
const FILE__REMOVED_MODEL                       = {};

/**
 * MODELS
 */
const CHATTING__MESSAGE_MODEL  					= require('../model/chatting.message-model').MODEL;


class Model extends BaseModel {

    constructor() {
        super(CHATTING__CONVERSATION_COLL);
    }

	/**
	 * Dev: VinhHV
	 * Func: Tạo cuộc hội thoại
	 * Date: ...
	 * Updated: MinhVH - 04/08/2021
	 */
	insertConversation({ name, description, authorID, membersID, isPrivate }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([authorID, ...membersID]) || !membersID || !membersID.length)
                    return resolve({ error: true, message: 'Request params authorID or membersID invalid', status: 400 });

				// Tạo cuộc hội thoại 2 người
				if(isPrivate){
					if(membersID.length > 1)
						return resolve({ error: true, message: 'Number of membersID must equal 1', status: 400 });

					// Kiểm tra nếu tồn tại cuộc hội thoại của hai người thì không tạo nữa
					let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({ 
						members: { $all: [authorID, ...membersID] }
					})

					for(let i = 0; i < checkExistConversation.length; i++){
						if(checkExistConversation[i].members.length === 2){
							return resolve({ error: true, message: 'Conversation already exists', status: 400 });
						}
					}
				} else{ // Tạo cuộc hội thoại nhiều hơn hai người ( Nhóm chat )
					if(membersID.length <= 1)
						return resolve({ error: true, message: 'Number of membersID must more than 1', status: 400 });

					if(membersID.length >= 100)
						return resolve({ error: true, message: 'Number of membersID over 100', status: 400 });
				}

                let infoConversationAfterInserted = await this.insertData({ 
					name, 
					description, 
					authors: [authorID],
					members: [...membersID, authorID]
				});
                if(!infoConversationAfterInserted)
                    return resolve({ error: true, message: "Can't create conversation", status: 403 });

                // let { _id: conversationID } = infoConversationAfterInserted;
                // let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                //     $addToSet: {
                //         members: {
                //             $each: [...membersID, authorID]
                //         }
                //     }
                // }, { new: true });

                // if(!infoConversationAfterUpdated)
                //     return resolve({ error: true, message: "Can't update member of conversation", status: 403 });

                // infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findById(infoConversationAfterUpdated._id).populate({
                //     path: 'members',
                //     select: '_id fullname image company friends receiveFromFriends sendToFriends ',
                //     populate: {
                //         path: "company"
                //     }
                // })

                return resolve({ error: false, data: infoConversationAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật thông tin cuộc hội thoại
	 * Date: 04/08/2021
	 */
	updateConversation({ conversationID, userID, name, description }) {
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params conversationID or userID invalid', status: 400 });

				let dataUpdate = {};
				name 		&& (dataUpdate.name 		= name);
				description && (dataUpdate.description 	= description);

				let infoAfterUpdate = await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
					_id: conversationID,
					members: { $in: [userID] }
				}, {
					$set: dataUpdate
				}, { new: true });

				if(!infoAfterUpdate)
					return resolve({ error: true, message: "Can't update conversation", status: 403 });

				return resolve({ error: false, data: infoAfterUpdate, status: 200 });
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Thêm thành viên cuộc hội thoại
	 * Date: 06/08/2021
	 */
	 addMembersToConversationByID({ conversationID, authorID, membersID }) {
        return new Promise(async (resolve) => {
            try {
                console.log({ membersID, conversationID, authorID })

                if(!checkObjectIDs([...membersID, conversationID, authorID]) || !Array.isArray(membersID) || !membersID.length)
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ 
					_id: conversationID, 
					author: { $in: [authorID] }
				}).populate('members');

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author", status: 403 });

                let listMembersInConversation = checkExistConversation.members;

				for (const member of listMembersInConversation) {
					if(membersID.includes(member._id.toString())){
						return resolve({ error: true, message: `Member ${member.fullname} is existed in conversation`, status: 403 });
					}
				}

                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $addToSet: {
                        members: { $each: membersID }
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: "Can't add member to conversation", status: 403 });

				await CHATTING__MESSAGE_MODEL.insertMessage({
					senderID: authorID, 
					content: '', 
					receiversID: infoConversationAfterUpdated.members,
					conversationID, 
					type: 1
				})

                return resolve({ error: false, data: infoConversationAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Xóa thành viên khỏi cuộc hội thoại
	 * Date: 06/08/2021
	 */
    removeMembersInConversation({ conversationID, authorID, membersID }) {
        return new Promise(async (resolve) => {
            try {
				console.log({ membersID, conversationID, authorID })

                if(!checkObjectIDs([...membersID, conversationID, authorID]) || !Array.isArray(membersID) || !membersID.length)
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(membersID.includes(authorID))
					return resolve({ error: true, message: "You can't remove you from conversation", status: 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ 
					_id: conversationID, 
					author: { $in: [authorID] }, 
					members: { $in: membersID }
				});

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author or member don't belong to chat group", status: 403 });

                // if(checkExistConversation.members.length <= 2){
                    // let resultDeleteConverSation = await CHATTING__CONVERSATION_COLL.findByIdAndDelete({ conversationID }); 
                    // return resolve({ error: false, data: checkExistConversation, status: 200});
                // }

                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $pullAll: {
                        members: membersID
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: "Can't remove members in conversation", status: 403 });

                return resolve({ error: false, data: infoConversationAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Lấy thông tin cuộc hội thoại của user
	 * Date: 04/08/2021
	 */
    getInfoConversationByID({ conversationID, userID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                const infoConversation = await CHATTING__CONVERSATION_COLL
					.findOne({ 
						_id: conversationID, 
						members: { $in: [userID] }
					})
                    .populate({
                        path: 'members authors',
                        select: '_id fullname image company friends birthDay username phone email',
                    })
                    .lean();

                if (!infoConversation) 
                    return resolve({ error: true, message: "Can't get info conversation", status: 403 });

                return resolve({ error: false, data: infoConversation, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: VinhHV
	 * Func: Tìm kiếm cuộc hội thoại theo tên
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
	getListConversationByKey({ userID, key }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				let conditionObj = { members: { $in: [userID] } };

				if(key){
					conditionObj.name = new RegExp(key, 'i');
				}

                let listConversationByKey = await CHATTING__CONVERSATION_COLL.find(conditionObj)
					.populate({
						path: 'members',
						select: '_id fullname image company friends receiveFromFriends sendToFriends'
					})
					// .limit(30)
					.sort({ modifyAt: -1 })
					.lean();

				if(!listConversationByKey)
					return resolve({ error: true, message: "Can't get list conversation", status: 403 });

                return resolve({ error: false, data: listConversationByKey, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        });
    }

	/**
	 * Dev: VinhNH 
     * Func: Lấy danh sách các cuộc hội thoại của một người dùng
	 * Date: ...
     * Formated: MinhVH - 16/07/2021
	 * Updated: MinhVH - 03/08/2021
     */
	getListConversationByUserID({ authorID, lastestConversationID }){
        return new Promise(async resolve => {
            try {
				// Check params
				if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

				if(lastestConversationID && !checkObjectIDs(lastestConversationID))
					return resolve({ error: true, message: 'Request params lastestConversationID invalid', status: 400 });

                let page 	= 1;
                let perPage = 20;

                if(lastestConversationID && checkObjectIDs(lastestConversationID)){
                    page = 2;
                }

				let conditionObj = {};
                let _sort = {
                    modifyAt: -1,
					createAt: -1,
					updateAt: -1
                }

				// Get info last conversation (limit 20 per list message)
                if(page === 2){
                    let conversationInfo = await CHATTING__CONVERSATION_COLL.findById(lastestConversationID);
                    if(!conversationInfo)
                        return resolve({ error: true, message: "Can't get info last conversation", status: 403 });

                    let nextInfo = `${conversationInfo.modifyAt}_${conversationInfo._id}`;

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys: ['modifyAt__-1', '_id__-1'] });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: 'Request params nextInfo invalid', status: 400 });

                    // _sort         = dataPagingAndSort.data.sort;
                    conditionObj = dataPagingAndSort.data.find;
                }
                conditionObj.members = { $in: [ObjectID(authorID)] };

                let listConversation = await CHATTING__CONVERSATION_COLL.find(conditionObj)
					.populate({
						path: 'lastMessage', 
						select: 'modifyAt  createAt sender content status', 
						populate: { 
							path: 'sender', 
							select: '_id fullname image company'
						}
					})
					.populate({
						path: 'pin', 
						select: '_id sender content status' 
					})
					.limit(perPage)
					.sort(_sort)
					.lean();

                let totalConversationPagePromise    = CHATTING__CONVERSATION_COLL.count({ members: { $in: [ObjectID(authorID)] } });
                let totalCheckExCurrentPagePromise  = CHATTING__CONVERSATION_COLL.count(conditionObj);

				const { currentPage, totalPage } = await calculateCurrentPage({
					totalPagePromise: totalConversationPagePromise,
					totalCurrentPagePromise: totalCheckExCurrentPagePromise,
					perPage
				})

                return resolve({ 
					error: false,
					status: 200,
					data: { 
						listConversation, 
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

	/**
	 * Dev: VinhNH 
     * Func: Lấy danh sách cuộc hội thoại có tin nhắn chưa đọc
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
     */
    getListConversationMissMessage({ userID, lastestConversationID }){
        return new Promise(async resolve => {
            try {
                // Check params
				if(!checkObjectIDs(userID))
					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if(lastestConversationID && !checkObjectIDs(lastestConversationID))
					return resolve({ error: true, message: 'Request params lastestConversationID invalid', status: 400 });

				let page = 1;
				let perPage 	= 20;

				if(lastestConversationID && checkObjectIDs(lastestConversationID)){
					page = 2;
				}

                const infoConversation = await AUTH__USER_COLL.findById(userID);
                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't in conversation", status: 403 });

                let listConversationMiss = infoConversation.converMiss || [];
				let conditionObj = {};
                let _sort = {
                    modifyAt: -1,
                    creatAt: -1
                }

                if(page === 2){
					let conversationInfo = await CHATTING__CONVERSATION_COLL.findById(lastestConversationID);
                    if(!conversationInfo)
                        return resolve({ error: true, message: "Can't get info last conversation", status: 403 });

                    let nextInfo = `${conversationInfo.modifyAt}_${conversationInfo._id}`;

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys: ['modifyAt__-1', '_id__-1'] });
                    if(!dataPagingAndSort || (dataPagingAndSort && dataPagingAndSort.error))
                        return resolve({ error: true, message: 'Request params invalid', status: 400 });

                    _sort        =  dataPagingAndSort.data.sort
                    conditionObj =  dataPagingAndSort.data.find;
                }
                conditionObj._id     = { $in: listConversationMiss };
                conditionObj.members = { $in: [userID] };

                const listConversationMissMessage = await CHATTING__CONVERSATION_COLL
					.find(conditionObj)
					.limit(perPage)
					.sort(_sort);

				return resolve({ 
					error: false,
					status: 200,
					data: { 
						listConversationMissMessage, 
						perPage,
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    // Cập nhật Link
    /* Author: Hoang
    * Date: 31/10/2010 - 4:10 PM.
    * Usage: save links.
    */
    updateLinks({ conversationID, userID, links }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                let infoUpdateLinks;
                let checkExits = await CHATTING__CONVERSATION_COLL.findOne({ _id : conversationID, members : {$in :[userID]}});
                if(!checkExits)
                    return resolve({ error: true, message: 'You are not member', status : 403 });
                    
                let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID);
                let oldLinks = infoConversation.links;
                let newLinks = [...oldLinks];
                if(oldLinks){
                    links.map((link, index) => {
                        if(!oldLinks.includes(link)){
                            newLinks.push(link);
                        }
                    })
                }
                infoUpdateLinks =await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,{
                    links: newLinks
                }, { new: true });
                if(!infoUpdateLinks)
                    return resolve({ error: true, message: 'Cant update', status : 403 });

                return resolve({ error: false, data: infoUpdateLinks, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Cập nhật logo
    /* Author: Hoang
    * Date: 18/10/2010 
    * Update: save file logo change.(remove S3 rontab)
    */
    updateLogo({ conversationID, userID, filesID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(filesID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                let infoUpdateMessage;
                let checkExits = await CHATTING__CONVERSATION_COLL.findOne({ _id : conversationID, author : {$in :[userID]}});
                if(!checkExits)
                    return resolve({ error: true, message: 'You are not member', status : 403 });
                infoUpdateMessage =await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,{
                    logo: filesID
                }, { new: true });
                if(!infoUpdateMessage)
                    return resolve({ error: true, message: 'You are not member', status : 403 });
                let infoFile = await FILE__FILE_COLL.findById(filesID);
                let result = await FILE__REMOVED_MODEL.insert({name: infoFile.name, path: infoFile.path});
                await FILE__FILE_COLL.removeByID(filesID);
                return resolve({ error: false, data: infoUpdateMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Cập nhật cuộc tên và mô tả hội thoại
    updateByID({ name, description, conversationID, userID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });
                let dataUpdate = {};
                let checkExistConversation;
                if(name){
                    dataUpdate.name = name;
                    checkExistConversation = await CHATTING__CONVERSATION_COLL.find({name : name});
                    if(!checkExistConversation)
                        return resolve({ error: true, message: 'New name Exits', status : 403 });
                }else{
                    return resolve({ error: true, message: 'Params invalid', status : 400 });
                }
                if(description){
                    dataUpdate.description = description;
                }

                if(!dataUpdate)
                    return resolve({ error: true, message: 'Params invalid', status : 400 });

                checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID, 
                    members: { $in: [userID] }
                });
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'You are not member', status : 403 });

                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, dataUpdate, { new: true})
                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant update', status : 403 });
    
                return resolve({ error: false, data: infoConversationAfterUpdated, oldName : checkExistConversation.name, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Lấy danh sách thông tin thành viên trong cuộc hội thoại
    getInfoMembersByID({ conversationID, userID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                const infoConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, members: { $in: [userID]} })
                    // .populate({
                    //     path: 'members',
                    //     select: '_id fullname image company friends receiveFromFriends sendToFriends converMiss birthDay username phone email',
                    //     populate: {
                    //         path: "company"
                    //     }
                    // })
                    // .populate('logo')
                    // .populate({
                    //     path: 'lastMessage'
                    // })
                    // .populate({
                    //     path: 'taskID',
                    //     select : 'task',
                    //     populate : {
                    //         path : 'task', select : '_id name'
                    //     }
                    // })
                    // .populate({
                    //     path : 'pin' 
                    // })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path : 'pin', select : '_id sender content status' 
                    })
                    .lean();
                    
                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't in conversation", status : 403 });

                let listMemebersID  = infoConversation.members;
                let listMembers =  await  AUTH__USER_COLL.find({ _id : { $in: listMemebersID } }).select('_id fullname email image position sendToFriends receiveFromFriends recentlyFriends friends');

                return resolve({ error: false, data: listMembers, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Tìm thành viên trong cuộc hội thoại
    getInfoMembersWithKey({ conversationID, userID, key }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Params invalid', status : 400 });


                const infoConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, members: { $in: [userID]} })
                    // .populate({
                    //     path: 'members',
                    //     select: '_id fullname image company friends receiveFromFriends sendToFriends converMiss birthDay username phone email',
                    //     populate: {
                    //         path: "company"
                    //     }
                    // })
                    // .populate('logo')
                    // .populate({
                    //     path: 'lastMessage'
                    // })
                    // .populate({
                    //     path: 'taskID',
                    //     select : 'task',
                    //     populate : {
                    //         path : 'task', select : '_id name'
                    //     }
                    // })
                    // .populate({
                    //     path : 'pin' 
                    // })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path : 'pin', select : '_id sender content status' 
                    })
                    .lean();
                    
                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't in conversation", status : 403 });


                let listMemebersID  = infoConversation.members;
                let listMembers =  await  AUTH__USER_COLL.find({ _id : { $in: listMemebersID }, fullname: new RegExp(key, 'i') }).select('_id fullname email image position sendToFriends receiveFromFriends recentlyFriends friends');

                return resolve({ error: false, data: listMembers });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Xóa cuộc hội thoại của author tạo ra, xóa luôn tất cả tin nhắn có trong message
    removeByID({ conversationID, authorID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                const infoConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, members: { $in: [authorID] }});
                if (!infoConversation)
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkRemoveAllMessage = await CHATTING__MESSAGE_MODEL.removeAllByConversationID({ conversationID });
                if (!checkRemoveAllMessage) 
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                return resolve({ error: false, data: infoConversation });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Rời khỏi cuộc hội thoại (nhóm chat)
    leaveByConversationID({ userID, conversationID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs(authorID) || !checkObjectIDs(conversationID)) 
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
               
                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $pull: {
                        members: userID
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant leave', status : 403 });
                
                return resolve({ error: false, data: infoConversationAfterUpdated });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Set admin mới cho nhóm
    insertNewAdmin({ member, conversationID, authorID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID)  || !checkObjectIDs(member) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, author: authorID });
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                member = [member]
                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $addToSet: {
                        author: [...member]
                    }
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant create', status : 403  }); 
                
                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // xoá admin 
    /* Author: Vinh
    * Update: Hoang - Date: 21/10/2010 
    * fix "infoConversationAfterUpdated is not defined"
    */
    removeAdmin({ adminID, conversationID, authorID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID)  || !checkObjectIDs(adminID) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ _id: conversationID, author: authorID });
                if(!checkExistConversation)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                
                let infoConversationAfterUpdated;
                if(checkExistConversation.author[0].toString() != adminID.toString()){
                    infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        $pull : {
                            author: adminID
                        }, 
                    }, { new: true });
    
                }else{
                    return resolve({ error: true, message:  'Permission denied', status : 403  });
                }   
                
                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: 'Cant Creata', status :403 });
                
                return resolve({ error: false, data: infoConversationAfterUpdated, status : 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    

    // Thêm tin nhắn ghim
    // Tìm kiếm cuộc hội thoại
    insertPinMessage({ messageID, conversationID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(messageID) || !checkObjectIDs(conversationID) || !checkObjectIDs(userID) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let exitCoversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID , members: { $in: [userID]}
                });

                if(!exitCoversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }

                let infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    pin : messageID
                })

                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });

                let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID)
                // .populate({ path : 'pin', populate :  { path : 'sender', select :'_id fullname  image'  }});
                return resolve({ error: false, data: infoConversation, status : 200})
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // xóa ghim của cuộc hội thoại
    deletePinMessage({ conversationID, userID }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID) )
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let exitCoversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID , members: { $in: [userID]}
                });

                if(!exitCoversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }

                let infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,
                    {
                        $unset : { pin :'' }
                    })
                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });

                let infoConversation = await CHATTING__CONVERSATION_COLL.findById(conversationID)
                .populate({ path : 'pin', populate :  { path : 'sender', select :'_id fullname  image'  }});

                return resolve({ error: false, data: infoConversation, status :200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    updateUserMissMessage({ conversationID, userID, isRep }) {
        return new Promise(async resolve => {
            try {
                let infoConversation = await CHATTING__CONVERSATION_COLL.find({
                    _id: conversationID, members: { $in: [userID] }
                }).lean();

                let infoUser = await AUTH__USER_COLL.findById(userID);
                if(!infoConversation)
                    return resolve({ error: true, message: 'Conversation exits', status: 403 });

                let infoUpdate 	= null;
                let arr 		= infoConversation[0].arrMissMessage;
                let newArr 		= [];

                // Kiểm  miss cuojc hội thoại là miss lần đầu hay đã miss rồi
                let isMiss 		= false;

                // Chưa tìm được câu query tốt nên xử lý theo luồng sau
                // Lấy danh sách miss tin nhắn tìm user miss sau đó cập nhật mảng mới cho conversation
                if(isRep){
                    if(infoConversation[0].arrMissMessage){
                        for(let i = 0; i < arr.length; i++){
                            if(arr[i].userID.toString() == userID.toString()){
                              
                            } else{
                                newArr.push(arr[i]);
                            }
                        }
                    }

                    infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        arrMissMessage: newArr
                    });

                    if(infoUser.converMiss.length){
                        await AUTH__USER_COLL.findByIdAndUpdate(userID, {
							$pull: {
								converMiss: conversationID
							}
                        })
                    }
                } else{
                    if(!infoUser.converMiss.includes(conversationID)){
                        conversationID = [conversationID]
						await AUTH__USER_COLL.findByIdAndUpdate(userID, {
							$addToSet: {
								converMiss: [...conversationID]
							}
                        })
                    }

                    if(infoConversation[0].arrMissMessage){
                        for(let i = 0; i < arr.length; i++){
                            if(arr[i].userID.toString() == userID.toString()){
								let itemMiss = arr[i];

                                let newAmout = Number(itemMiss.amout) + 1;
                                let newItem  = { _id: itemMiss._id, userID: userID, amout: newAmout };

                                newArr.push(newItem);
                                isMiss = true;
                            } else{
                                newArr.push(itemMiss);
                            }
                        }
                    }

                    if(isMiss){
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                            arrMissMessage: newArr
                        });
                    } else{
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                            $addToSet: {
                                arrMissMessage: [{
									userID: userID,
									amout: 1
                                }]
                            }   
                        });
                      
                    }

                }

                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status: 403 });

                return resolve({ error: false, data: infoUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        });
    }

    updateMessageTyping({ conversationID, userID, content }) {
        return new Promise(async resolve => {
            try {
                let infoConversation = await CHATTING__CONVERSATION_COLL.find({
                    _id : conversationID , members: { $in: [userID]}
                    });
                let infoUser = await AUTH__USER_COLL.findById(userID);
                if(!infoConversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }
                content = content.trim()
                let infoUpdate;
                let arr = infoConversation[0].arrMesageTypingUsers;
                let newArr = [];
                // Kiểm  typing cuojc hội thoại là miss lần đầu hay đã typing rồi
                let isTyping = false;
                // Chưa tìm được câu query tốt nên xử lý theo luồng sau
                // Lấy danh sách miss tin nhắn tìm user miss sau đó cập nhật mảng mới cho conversation
                   
                if(infoConversation[0].arrMesageTypingUsers){
                    if(arr.length > 0){
                        for(let i=0; i < arr.length; i++){
                            if(arr[i].userID.toString() === userID.toString()){
                                isTyping = false;   // nếu có rồi;
                                break;
                            }else{
                                isTyping = true;// nếu chưa có trong mãng
                            }
                        }
                        if(isTyping){
                            let newItem = { userID : userID, messageTyping : content  }
                            newArr.push(newItem);
                            newArr = newArr.concat(arr);
                        }else{
                            for(let i=0; i < arr.length; i++){
                                if(arr[i].userID.toString() == userID.toString()){
                                    let newItem = { _id : arr[i]._id, userID : userID, messageTyping : content }
                                    newArr.push(newItem);
                                }else{
                                    newArr.push(arr[i]);

                                }
                            }
                        }
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                            conversationID
                        ,
                        {
                            arrMesageTypingUsers:  newArr
                        });
                    
                    }else{
                        infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                            conversationID
                        ,
                        {
                            arrMesageTypingUsers:  [ { userID , messageTyping : content } ]
                        });
                    }
                }
        
                if(!infoUpdate)
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });

                return resolve({ error: false, data: infoUpdate, status : 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    updateUserOffline({  userID, time }) {
        return new Promise(async resolve => {
            try {
                let infoConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [userID] } });
                if(!infoConversation){
                    return resolve({ error: true, message: 'Conversation exits', status : 403  });
                }
                
                let infoUpdate;
                let arr;
                let newArr = [];
                let conversationID ;

                for(let i=0; i< infoConversation.length; i++){
                    if(infoConversation[i].members.length ==2){
                        arr = infoConversation[i].arrMissMessage;
                        conversationID   = infoConversation[i]._id;
                        let hadArrMiss = false;

                        if(arr){
                            for(let i=0; i < arr.length; i++){
                                if(arr[i].userID.toString() == userID.toString()){
                                    let newItem = { _id : arr[i]._id, userID : userID, amout :  arr[i].amout, timeOffline : time }
                                    newArr.push(newItem);
                                    hadArrMiss = true;
                                }else{
                                    newArr.push(arr[i]);
                                }
                            }
                        }
                        if(hadArrMiss){
                            infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(
                                    conversationID
                                ,
                                {
                                    arrMissMessage:  newArr
                                });
                        }else{
                            infoUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,
                                {
                                    $addToSet: {
                                        arrMissMessage:[ {
                                            userID : userID,  amout : 0,  timeOffline : time
                                        }]
                                    }   
                                });
                        }
                        
                        newArr = [] 
                    }
                }
              
                // Chưa tìm được câu query tốt nên xử lý theo luồng sau
                // Lấy danh sách miss tin nhắn tìm user miss sau đó cập nhật mảng mới cho conversation
                return resolve({ error: false, message:'update_success', status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // Cập nhật tên các cuộc hội thoại riêng tư để phục vụ tìm kiếm cho dễ dàng
    updatePrivateName() {
        return new Promise(async resolve => {
            try {
               let allConversationPrivate = await CHATTING__CONVERSATION_COLL.find({
                members: { $size: 2 }
               }).populate({
                   select :'fullname',
                   path :'members'
               })

               for (const  conversation of allConversationPrivate){
                    let newName ='';
                    conversation.members.forEach(member=>{
                        newName += ` ${member.fullname}`;
                    });
                    let result = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversation._id,{
                        name : newName
                    });
               }
               return resolve({ error: false, message: '=============DONE===========' });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    // Xóa các cuộc hội thoại riêng tư do tạo trùng nhiều lần
    RemovePrivateCoincide() {
        return new Promise(async resolve => {
            try {
               let allConversationPravite = await CHATTING__CONVERSATION_COLL.find({
                members: { $size: 2 }
               }).populate({
                   select :'_id',
                   path :'members'
               });

               let arrRemove =[];
               let arrRoot = [];

               for(let i =0; i< allConversationPravite.length ; i++){
                    let _members = allConversationPravite[i].members;
                    if(!arrRemove.includes( allConversationPravite[i]._id)){
                        arrRoot.push(allConversationPravite[i]._id);
                        for(let y =0; y< allConversationPravite.length; y++){
                            let isCoincide = true;
                            allConversationPravite[y].members.forEach(member=>{
                                if(!_members.includes(member)){
                                    isCoincide = false;
                                }
                            })
                            if(isCoincide){
                                if(!allConversationPravite[y].lastMessage && !arrRemove.includes(allConversationPravite[y]._id) &&!arrRoot.includes(allConversationPravite[y]._id)){
                                    arrRemove.push(allConversationPravite[y]._id);
                                }
                            }
                        }
                    }
                  
               }
               
               for (const  itemRemove of arrRemove){
                   let resultDelete  = await CHATTING__CONVERSATION_COLL.findOneAndRemove({ _id: `${itemRemove}`});
               }

                let _arrRemove =[];
                let _arrRoot = [];
                for(let i = allConversationPravite.length -1; i>=0; i--){
                    let _members = allConversationPravite[i].members;
                    if(!_arrRemove.includes( allConversationPravite[i]._id)){
                        _arrRoot.push(allConversationPravite[i]._id);
                        for(let y =allConversationPravite.length -1; y>=0; y--){
                            let isCoincide = true;
                            allConversationPravite[y].members.forEach(member=>{
                                if(!_members.includes(member)){
                                    isCoincide = false;
                                }
                            })
                            if(isCoincide){
                                if(!allConversationPravite[y].lastMessage && !_arrRemove.includes(allConversationPravite[y]._id) &&!_arrRoot.includes(allConversationPravite[y]._id)){
                                    _arrRemove.push(allConversationPravite[y]._id);
                                }
                            }
                        }
                    }
                
            }
            
            for (const  itemRemove of _arrRemove){
                let resultDelete  = await CHATTING__CONVERSATION_COLL.findOneAndRemove({ _id: `${itemRemove}`});
            }
                return resolve({ error: false, message: '=============DONE===========' });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        });
    }

    /**
    * Name: Cập nhật thông tin công việc
    * Author: VinhNH 
    * Updated:
    * - 12/10/2020-VinhNH: Cập nhật lại populate cho mobiles
    * Usage:
    * - Web: Cập nhật thông tin công việc
    * - Mobile:  Cập nhật lại populate cho mobiles : ngày gửi tin, ngày tương tác tin nhăn
    */
    // lấy  các cuộc hội thoại phân trang
    getConversationWithPage({ authorID, currentPage, isMobile }){
        return new Promise(async(resolve)=>{
            try {
                const page = Number(currentPage) || 1;
                let perPage = 20;
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let listConversation;
                if(!isMobile){
                    listConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [ObjectID(authorID)] } })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path: 'members',
                        select: '_id fullname image company friends receiveFromFriends sendToFriends',
                    })
                    .populate({
                        path: 'logo'
                    })
                    .populate({
                        path : 'pin', select : 'sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .sort({
                        modifyAt: -1,
                        creatAt: -1
                    }).skip((page * perPage) - perPage)
                    .limit(perPage)
                }else{
                    perPage = 12;
                    listConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [ObjectID(authorID)] } })
                    .populate({
                        path : 'lastMessage', select : 'modifyAt  createAt sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .populate({
                        path: 'members',
                        select: '_id fullname image company ',
                    })
                    .populate({
                        path: 'logo'
                    })
                    .populate({
                        path : 'pin', select : 'sender content status', populate :{ path : 'sender', select :'_id fullname image company ' }
                    })
                    .sort({
                        modifyAt: -1,
                        creatAt: -1
                    }).skip((page * perPage) - perPage)
                    .limit(perPage)
                }

                let infoUser = await AUTH__USER_COLL.findById(authorID);
                let amountNotificationNotSeen = infoUser.converMiss &&  infoUser.converMiss.length;
                
                return resolve({ error: false, data: listConversation, page, amountNotificationNotSeen });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // lấy  các cuộc hội thoại
    getAllConversation({ authorID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                const listConversation = await CHATTING__CONVERSATION_COLL.find({ members: { $in: [ObjectID(authorID)] } })
                    .populate({
                        path: 'lastMessage'
                    })
                    .populate({
                        path: 'members',
                        select: '_id fullname image company friends receiveFromFriends sendToFriends',
                    })
                    .populate({
                        path: 'logo',
                        select: 'path'
                    })
                    .populate({
                        path : 'pin', populate :  'sender' 
                    })
                    .sort({
                        modifyAt: -1,
                        creatAt: -1
                    })


             
                
                return resolve({ error: false, data : listConversation, status : 200});
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    updateStatusMessageMiss({ authorID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });

                let  infoUser = await AUTH__USER_COLL.findById(authorID);
                let lisConverMiss = infoUser.converMiss
                if(lisConverMiss){
                    for(const conver of lisConverMiss){
                        let converMis =  await CHATTING__CONVERSATION_COLL.findById(conver)
                        let lastMessage = converMis.lastMessage;
                        let infoAffterUpdate = await CHATTING__MESSAGE_MODEL.updateReceive({ messageID : lastMessage })
                    }
                    return resolve({ error: false, message : 'updated_success', status: 200 });
                }else{
                    return resolve({ error: false, message : 'nothing_update', status: 200 });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Author  : VinhNh
    // 16/10/2020
    // Lấy thông tin của một thành viên trong cuộc hội thoaij
    //
    // getInfoOneMembersInConversation()
    getInfoOneMembersInConversation({ conversationID, authorID, memberID }){
        return new Promise(async(resolve)=>{
            try {

                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID) || !checkObjectIDs(memberID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                //  Kiểm tra người yêu cầu thông tin của thành viên trong cuộc hội thoại cả 2 có cùng cuộc hội thoại  không 
                let checkExistConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $all: [authorID, memberID] }
                });
                if(!checkExistConversation || checkExistConversation.length == 0)
                    return resolve({ error: true, message:  'Permission denied', status : 403  });

                let infoUser  =  await   AUTH__USER_COLL.findById(memberID).select('_id fullname image email username phone birthDay');

                if(!infoUser)
                    return resolve({ error: true, message:  'Permission denied', status : 403  });

                return resolve({ error: false, data :  infoUser, status : 200});

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * 
     * @param {conversationID} ID of groupchat
     * @param {conversationID} authorID of user 
     */
    getLinks({ conversationID, authorID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.find({
                    _id: conversationID ,
                    members: { $in: [authorID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let dataConversation = await CHATTING__CONVERSATION_COLL.find({ _id: conversationID});
                if(dataConversation && dataConversation[0]){
                    let links = dataConversation[0].links;
                    return resolve({ error: false, data : { links }, status : 200 });
                }
                    return resolve({ error: false, data : { }, status :200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * author : HuynhVinh
     * decription : chức năng gắn taskID mặt định cho các cuộc hội thoại
     * phục vụ cho việc giao việc (giúp xếp giao việc)
     */
    configTaskDefaults({ conversationID, authorID, taskID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.find({
                        _id: conversationID ,
                        members: { $in: [authorID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                let listTaskID =  isMemberInConversation.taskID;
                let newList = [];
                if(!listTaskID){
                    newList = [{
                        task  : taskID, 
                        userCreate : authorID
                    }]
                }else{
                    listTaskID.forEach(item=>{
                        if(item.userCreate.toString() == authorID.toString() ){
                            newList.push({
                                task  : taskID, 
                                userCreate : authorID
                            })
                        }else{
                            newList.push({
                                task  : taskID, 
                                userCreate : authorID
                            })
                        }
                    })
                }
                let dataConversation = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID,{
                    taskID : newList
                });
                if(!dataConversation) 
                    return resolve({ error: true, message:  'Cant update', status : 403  });

                return resolve({ error: false, data:  dataConversation });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    /**
     * author : HuynhVinh
     * decription : chức năng Tắt thông báo của cuộc  hội thoại
     * 
    */
    muteConversation({ conversationID, userID, time }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID) || !time)
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let listMute =  isMemberInConversation.usersMute;
                let resultUpdate;
                if(!listMute || (listMute && !listMute.length)){
                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, { usersMute : [{ user : userID, time }] })
                }
                if(listMute && listMute.length){
                    let newMuteUser = [];
                    let isNewUser  = true;
                    listMute.forEach(user=>{
                        let _user = {};
                        if(user.user && user.user.toString() ==  userID.toString()){
                            _user.user = user.user;
                            _user.time = time;
                            _user._id = user._id;
                            isNewUser = false;
                        }

                        if(user.user  && user.user.toString() !=  userID.toString()){
                            _user = user;
                        }
                        newMuteUser.push(_user);
                    })

                    if(isNewUser){
                        newMuteUser.push({ user : userID, time })
                    }

                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, { usersMute : newMuteUser })
                }
                
                if(!resultUpdate)
                    return resolve({ error: true, message:'Cant udpate',  status : 403 });

                return resolve({ error: false, data :  resultUpdate, status : 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Mở lại thông báo của một cuộc hội thoại
    unMuteConversation({ conversationID, userID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let listMute =  isMemberInConversation.usersMute;
                let resultUpdate;
                if(!listMute)
                    return resolve({ error: false, message : 'UnMute success', status: 200});

                let newMuteUser = [];
                listMute.forEach(user=>{
                    if(user.user && user.user.toString() !=  userID.toString()){
                        newMuteUser.push(user);
                    }
                });
                resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, { usersMute : newMuteUser })
                
                if(!resultUpdate)
                    return resolve({ error: true, message:'Cant udpate',  status : 403 });

                return resolve({ error: false, data :  resultUpdate });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Pin một cuộc hội thoại
    pinConversation({ conversationID, userID }){
        return new Promise(async(resolve)=>{
            try {

                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let lisPin =  (isMemberInConversation && isMemberInConversation.usersPin ) ||  [];
                for(let i = 0; i<lisPin.length; i++){
                    if(lisPin[i] && lisPin[i].toString() == userID.toString()){
                        return resolve({ error: false, message:  'You pined', status : 200  });
                    }
                }

                let resultUpdate;
                if(lisPin && lisPin.length){

                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        $addToSet: {
                            usersPin: [...userID]
                        }
                    }); 
                }
                if(!lisPin ||(lisPin && !lisPin.length)){
                    resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                        usersPin: [userID]
                    }); 
                }

                if(!resultUpdate)
                    return resolve({ error: true, message: 'Cant pin conversation', status : 403 });

                return resolve({ error: false, data :  resultUpdate, status : 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    //Xoá Pin 1 cuộc hội thoại
    unPinConversation({ conversationID, userID }){
        return new Promise(async(resolve)=>{
            try {
                if(!checkObjectIDs(conversationID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params invalid', status : 400 });
                
                let isMemberInConversation  = await CHATTING__CONVERSATION_COLL.findOne({
                    _id: conversationID ,
                    members: { $in: [userID] }
                });

                if(!isMemberInConversation)
                    return resolve({ error: true, message:  'You are not member', status : 403  });
                
                let lisPin =  isMemberInConversation.usersPin || [];
                
                let isNotePin = true;
                for(let i = 0; i<lisPin.length; i++){
                    if(lisPin[i] && lisPin[i].toString() == userID.toString()){
                        isNotePin = false;
                        break;
                    }
                }
                if(isNotePin)
                    return resolve({ error: false, message:'Removed pin', status : 200 })

                let resultUpdate  = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $pull: {
                        usersPin: userID
                    }
                }); 
                
                if(!resultUpdate)
                    return resolve({ error: true, message: 'Cant unpin conversation', status : 403 });

                return resolve({ error: false, data :  resultUpdate, status : 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

    // Lấy danh sách pin các cuộc hội thoại
    getListConversationPinByUser(userID){

    }

}

exports.MODEL = new Model;