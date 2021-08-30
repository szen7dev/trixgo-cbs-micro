"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  = require('mongoose').Types.ObjectId;
const moment									= require('moment');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 						= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_REMINDER } 					= require('../../reminder/helper/reminder.actions-constant');

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
const CHATTING__MESSAGE_COLL					= require('../database/chatting.message-coll');
const CHATTING__CONVERSATION_COLL               = require('../database/chatting.conversation-coll');
const CHATTING__CONVERSATION_FILE_COLL          = require('../database/chatting.conversation_file-coll');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');

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
				if(isPrivate === "true"){
					if(membersID.length > 1)
						return resolve({ error: true, message: 'Number of membersID must equal 1', status: 400 });

					// Kiểm tra nếu tồn tại cuộc hội thoại của hai người thì không tạo nữa
					let checkExistConversation = await CHATTING__CONVERSATION_COLL.find({ 
						members: { $all: [authorID, ...membersID] }
					}).lean()

					for(let i = 0; i < checkExistConversation.length; i++){
						if(checkExistConversation[i].members.length === 2){
							return resolve({ error: true, message: 'Conversation already exists', status: 403 });
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

                // infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findById(infoConversationAfterUpdated._id).populate({
                //     path: 'members',
                //     select: '_id fullname image company friends receiveFromFriends sendToFriends ',
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
	updateConversation({ conversationID, userID, name, description, avatar, ctx }) {
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params conversationID or userID invalid', status: 400 });

				let dataUpdate 	= {};
				name 		&& (dataUpdate.name 		= name);
				description && (dataUpdate.description 	= description);

				// Cập nhật avatar cuộc hội thoại
				if(avatar){
					let infoAvatarConversation = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, {
						app: CF_DOMAIN_SERVICES.CHATTING,
						name: avatar.name,
						url: avatar.url,
						size: avatar.size,
						userID,
					});

					if(infoAvatarConversation.error)
						return resolve({ error: true, message: 'Update avatar conversation failed', status: 403 });

					let infoAfterInserted = await CHATTING__CONVERSATION_FILE_COLL.create({
						conversation: conversationID,
						file: infoAvatarConversation.data._id
					});
					dataUpdate.avatar = infoAfterInserted && infoAfterInserted._id;
				}

				let infoAfterUpdate = await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
					_id: conversationID,
					members: { $in: [userID] }
				}, {
					$set: dataUpdate
				}, { new: true });

				if(!infoAfterUpdate)
					return resolve({ error: true, message: "Can't update conversation", status: 403 });

				if(name){
					await CHATTING__MESSAGE_MODEL.insertMessage({
						senderID: userID,
						receiversID: infoAfterUpdate.members,
						conversationID, 
						type: 103
					})
				}

				if(avatar){
					await CHATTING__MESSAGE_MODEL.insertMessage({
						senderID: userID,
						receiversID: infoAfterUpdate.members,
						conversationID, 
						type: 104
					})
				}

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
                if(!checkObjectIDs([...membersID, conversationID, authorID]) || !Array.isArray(membersID) || !membersID.length)
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ 
					_id: conversationID, 
					authors: { $in: [authorID] }
				}).populate('members');

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author", status: 403 });

				for (const member of checkExistConversation.members) {
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

				// INSERT USER MISS MESSAGE (DEFAULT 0)
				let usersMissMessage = membersID.map(memberID => ({ userID: memberID, amount: 0 }))
				await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$addToSet: { usersMissMessage }
				}, { new: true });

				// INSERT MESSAGE ADD MEMBER TO CONVERSATION
				await CHATTING__MESSAGE_MODEL.insertMessage({
					senderID: authorID,
					receiversID: infoConversationAfterUpdated.members,
					usersAssigned: membersID,
					conversationID, 
					type: 101
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
	removeMemberInConversation({ conversationID, authorID, memberID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([conversationID, authorID, memberID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(memberID === authorID)
					return resolve({ error: true, message: "You can't remove you from conversation", status: 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({ 
					_id: conversationID, 
					authors: { $in: [authorID] }, 
					members: { $in: [memberID] }
				});

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author or member don't belong to chat group", status: 403 });

                // if(checkExistConversation.members.length <= 2){
                    // let resultDeleteConverSation = await CHATTING__CONVERSATION_COLL.findByIdAndDelete({ conversationID }); 
                    // return resolve({ error: false, data: checkExistConversation, status: 200});
                // }

				let pullMemberObj = {};

				if(checkExistConversation.authors.includes(memberID)){

					// Nếu là root author -> dc xoá các author khác
					if(checkExistConversation.authors[0].toString() === authorID){
						pullMemberObj.authors = [memberID];
						pullMemberObj.members = [memberID];
					} else{
						return resolve({ error: true, message: "You don't have permission remove author", status: 403 });
					}

				} else{
					pullMemberObj.members = [memberID];
				}

                let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
                    $pullAll: pullMemberObj,
					$pull: {
						usersMissMessage: { userID: memberID }
					}
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: "Can't remove members in conversation", status: 403 });

				// INSERT MESSAGE REMOVE MEMBER TO CONVERSATION
				await CHATTING__MESSAGE_MODEL.insertMessage({
					senderID: authorID,
					receiversID: infoConversationAfterUpdated.members,
					usersAssigned: [memberID],
					conversationID, 
					type: 102
				})

                return resolve({ error: false, data: infoConversationAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Set member thành admin cho cuộc hội thoại (hoặc ngược lại)
	 * Date: 07/08/2021
	 */
	updateAdminConversation({ conversationID, authorID, memberID, isSetAdmin }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([conversationID, authorID, memberID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					authors: { $in: [authorID] }
				});

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author", status: 403 });

				let infoConversationAfterUpdated = null, typeMessage = 0;
				// Cập nhật member thành admin
				if(isSetAdmin === "true"){
					if(checkExistConversation.authors.includes(memberID))
						return resolve({ error: true, message: "Member is already an author", status: 403 });

					infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$addToSet: {
							authors: memberID
						}
					}, { new: true });

					typeMessage = 105;

				} else{ // Cập nhật admin thành member
					if(checkExistConversation.authors[0].toString() === memberID.toString())
						return resolve({ error: true, message: "Can't remove author root", status: 403 });

					infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$pull: {
							authors: memberID
						}, 
					}, { new: true });

					typeMessage = 106;
				}

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: "Can't update author for conversation", status: 403 });

				await CHATTING__MESSAGE_MODEL.insertMessage({
					conversationID, 
					senderID: authorID,
					type: typeMessage,
					usersAssigned: [memberID],
					receiversID: checkExistConversation.members,
				})

                return resolve({ error: false, data: infoConversationAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status : 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Cài đặt cuộc hội thoại (group chat)
	 * Date: 09/08/2021
	 */
	updateConfigConversation({ conversationID, authorID, typeConfig, valueConfig }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([conversationID, authorID]) || ![1,2].includes(+valueConfig))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

                let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					authors: { $in: [authorID] }
				});

                if(!checkExistConversation)
                    return resolve({ error: true, message: "You aren't author", status: 403 });

				let dataUpdate = {};
				/**
				 * 1: Làm nổi bật tin của Admin
				 * 2: Member mới được xem tin nhắn cũ
				 * 3: Members được sửa thông tin nhóm
				 * 4: Members được tạo ghi chú, nhắc hẹn
				 * 5: Members được tạo bình chọn
				 * 6: Members được ghim tin nhắn
				 * 7: Members được gửi tin nhắn
				 */
				switch (+typeConfig) {
					case 1:
						dataUpdate.config = { configHighlight: +valueConfig };
						break;
					case 2:
						dataUpdate.config = { configSeeOldMessage: +valueConfig };
						break;
					case 3:
						dataUpdate.config = { configEditInfo: +valueConfig };
						break;
					case 4:
						dataUpdate.config = { configCreateNote: +valueConfig };
						break;
					case 5:
						dataUpdate.config = { configCreatePoll: +valueConfig };
						break;
					case 6:
						dataUpdate.config = { configPinMessage: +valueConfig };
						break;
					case 7:
						dataUpdate.config = { configSendMessage: +valueConfig };
						break;
					default:
						break;
				}

				let infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$set: dataUpdate
				}, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: "Can't update config conversation", status: 403 });

                return resolve({ error: false, data: infoConversationAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật pin cuộc hội thoại
	 * Date: 10/08/2021
	 */
	updatePinConversation({ conversationID, userID, isPin, ctx }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				});
				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member of conversation", status: 403 });

				let infoUserAfterUpdated = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.UPDATE_PIN_CONVERSATION}`, {
					conversationID, userID, isPin
				});
				if(infoUserAfterUpdated.error)
					return resolve({ ...infoUserAfterUpdated, status: 403 });

				return resolve({ error: false, data: infoUserAfterUpdated.data, status: 200 });
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
					.populate({
						path: 'avatar',
						populate: 'file'
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
	 * Dev: MinhVH
	 * Func: Xem các nhóm chung với 1 thành viên
	 * Date: 11/08/2021
	 */
	getInfoGeneralGroupsByMember({ userID, memberID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([userID, memberID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				const listGroupConversationsOfUser = await CHATTING__CONVERSATION_COLL
					.find({ 
						members: { $in: [userID] }, 
						$nor: [
							{members: {$exists: false}},
							{members: {$size: 0}},
							{members: {$size: 2}}
						]	
					})
					.select('_id name description authors avatar')
					.populate({
						path: 'avatar authors',
						select: '_id fullname username',
						populate: {
							path: 'file',
							select: 'url'
						}
					})
					.lean();

				const listGroupConversationsOfMember = await CHATTING__CONVERSATION_COLL
					.find({ 
						members: { $in: [memberID] },
						$nor: [
							{members: {$exists: false}},
							{members: {$size: 0}},
							{members: {$size: 2}}
						]
					})
					.select('_id name description authors avatar')
					.populate({
						path: 'avatar authors',
						select: '_id fullname username',
						populate: {
							path: 'file',
							select: 'url'
						}
					})
					.lean();

				let listGeneralConversation = [];

				listGroupConversationsOfUser.map(conversationOfUser => {
					listGroupConversationsOfMember.map(conversationOfMember => {
						// Kiểm tra chung nhóm hội thoại
						if(conversationOfUser._id.toString() === conversationOfMember._id.toString()){

							listGeneralConversation[listGeneralConversation.length] = {
								name: conversationOfMember.name,
								description: conversationOfMember.description,
								infoOwner: conversationOfMember.authors && conversationOfMember.authors[0],
								avatar: (conversationOfMember.avatar && conversationOfMember.avatar.file) && conversationOfMember.avatar.file.url
							};

						}
					})
				})

                return resolve({ error: false, data: listGeneralConversation, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách members cuộc hội thoại
	 * Date: ...
	 * Updated: 10/08/2021 - MinhVH
	 */
	getListMembersConversationByID({ conversationID, userID }){
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
                        path: 'members',
                        select: '_id fullname image birthDay username phone email',
                    })
                    .lean();

                if (!infoConversation) 
                    return resolve({ error: true, message: "You aren't member of conversation", status: 403 });

                // let listMembers = await AUTH__USER_COLL
				// 	.find({ _id: { $in: infoConversation.members } })
				// 	.select('_id fullname email image position sendToFriends receiveFromFriends recentlyFriends friends')
				// 	.lean();

                return resolve({ error: false, data: infoConversation.members, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách tin nhắn cuộc hội thoại (tìm kiếm tin nhắn, phân trang)
	 * Date: ...
	 * Updated: MinhVH - 11/08/2021
	 */
	getListMessagesConversationWithPage({ conversationID, latestMessageID, userID, key }){
		return new Promise(async resolve => {
			try {
				let page 	= 1;
				let perPage = 10;

				if(latestMessageID && checkObjectIDs(latestMessageID)){
					page = 2;
				}

				// Check params
				if(page === 1 && !checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				if(page === 2 && !checkObjectIDs([conversationID, userID, latestMessageID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member", status: 403 });

				// Init condition object
				let conditionObj = { conversation: conversationID };
				let objSort 	 = {};
				let sortBy = {
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
					// sortBy          = dataPagingAndSort.data.sort;
				}

				// CHECK USER DELETE HISTORY
				if(checkExistConversation.usersDeleteHistory && checkExistConversation.usersDeleteHistory.length){
					let checkExistInUserDeleteHistory = checkExistConversation.usersDeleteHistory.find(user => user.userID.toString() === userID)

					if(checkExistInUserDeleteHistory){
						conditionObj._id = { $gt: checkExistInUserDeleteHistory.lastMessage };
					}
				}

				// SEARCH TEXT
				if(key){
					conditionObj.$text = { $search: key };
					objSort.score = { $meta: "textScore" };
					sortBy.score = { $meta: "textScore" };
				}

				let listMessages = await CHATTING__MESSAGE_COLL.find(conditionObj, objSort)
					.populate({
					    path: 'sender usersSeen receivers usersAssigned files.file', 
						select: '_id fullname image',
						populate: 'file',
					})
					.populate('parent poll reminder')
					// .select('sender content status type createAt')
					.sort(sortBy)
					.limit(perPage)
					.lean();

				if(!key){
					listMessages = listMessages.reverse();
				}

				return resolve({ 
					error: false,
					status: 200,
					data: listMessages
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Tìm kiếm tin nhắn cuộc hội thoại (Dữ liệu trả về là 5 tin nhắn trước và sau tin nhắn tìm thấy)
	 * Date: 23/08/2021
	 */
	searchMessageConversationById({ conversationID, userID, messageID }){
		return new Promise(async resolve => {
			try {
				// Check params
				if(!checkObjectIDs([conversationID, messageID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member", status: 403 });

				let conditionObjFrontList 		= { _id: { $lt: messageID }, conversation: conversationID };
				let conditionObjBackList 		= { _id: { $gt: messageID }, conversation: conversationID };
				let conditionObjSearchMessage 	= { _id: { $in: [messageID] }, conversation: conversationID };
				let _sort = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
				};

				// CHECK USER DELETE HISTORY
				if(checkExistConversation.usersDeleteHistory && checkExistConversation.usersDeleteHistory.length){
					let checkExistInUserDeleteHistory = checkExistConversation.usersDeleteHistory.find(user => user.userID.toString() === userID)

					if(checkExistInUserDeleteHistory){
						conditionObjSearchMessage._id.$gt = checkExistInUserDeleteHistory.lastMessage;
						conditionObjFrontList._id.$gt = checkExistInUserDeleteHistory.lastMessage;
					}
				}

				let infoMessage = await CHATTING__MESSAGE_COLL.findOne(conditionObjSearchMessage);
				if(!infoMessage)
					return resolve({ error: true, message: "Can't get info message", status: 400 });

				let listMessagesFront = await CHATTING__MESSAGE_COLL.find(conditionObjFrontList)
					// .populate({
					//     path: 'sender', select:'_id fullname image company' 
					// })
					// .select('sender content status type createAt')
					.sort(_sort)
					.limit(5)
					.lean();

				let listMessagesBack = await CHATTING__MESSAGE_COLL.find(conditionObjBackList)
					// .populate({
					//     path: 'sender', select: '_id fullname image company' 
					// })
					// .select('sender content status type createAt')
					.sort(_sort)
					.limit(5)
					.lean();

				let listMessages = [...listMessagesFront.reverse(), infoMessage, ...listMessagesBack.reverse()];

				return resolve({ 
					error: false,
					status: 200,
					data: listMessages
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách tin nhắn media cuộc hội thoại
	 * Date: 12/08/2021
	 */
	getListMessagesMediaConversation({ 
		conversationID, userID, typeMessage, senderID, dateCreate, fromDate, toDate, isLoadAll 
	}){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				let conditionObj = { 
					conversation: ObjectID(conversationID), 
					type: +typeMessage
				};

				if(senderID && checkObjectIDs([senderID])){
					conditionObj.sender = ObjectID(senderID);
				}

				if(dateCreate){
					conditionObj.createAt = {
						$gte: new Date(moment(dateCreate).startOf('day').format()),
						$lt: new Date(moment(dateCreate).endOf('day').format())
					};
				}

				if(fromDate && toDate){
					conditionObj.createAt = {
						$gte: new Date(moment(fromDate).startOf('day').format()),
						$lte: new Date(moment(toDate).endOf('day').format())
					}
				}

				let groupObj = {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createAt" } },
					dataFormat: { 
						$first: { 
							$dateToString: { format: "%d/%m/%Y", date: "$createAt" }
						}
					},
					// _id: { month: { $month: "$createAt" }, day: { $dayOfMonth: "$createAt" }, year: { $year: "$createAt" } },
					listMessage: { 
						$push: {
							_id: "$_id",
							senderID: "$sender._id",
							senderName: "$sender.fullname",
							content: "$content",
							status: "$status",
							type: "$type",
							files: "$files",
							modifyAt: "$modifyAt",
							createAt: "$createAt",
						}
					},
					count: { $sum: 1 }
				};

				let pipeline = [
					{ $match: conditionObj },
					{
						$lookup: {
							from: 'users',
							localField: 'sender',
							foreignField: '_id',
							as: 'sender'
						}
					},
					{
						$unwind: {
							path: "$sender",
							preserveNullAndEmptyArrays: true
						}
					},
					{ $group: groupObj },
					{ $sort: { "_id": -1 } }
				]

				if(!isLoadAll){
					pipeline.push({ $limit: 10 });
				}

				let listMedia = await CHATTING__MESSAGE_COLL.aggregate(pipeline);

				return resolve({ error: false, data: listMedia, status: 200 })
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách thành viên gửi tin nhắn media cuộc hội thoại
	 * Date: 13/08/2021
	 */
	getListMemberSendMessagesMediaConversation({ conversationID, userID }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
				}).populate('members').lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				let listMemberSendMediaInConversation = checkExistConversation.members.map(async member => {
					let condition = { conversation: conversationID, sender: member._id };
					let totalImagePromise = CHATTING__MESSAGE_COLL.countDocuments({ ...condition, type: 1 });
					let totalFilePromise = CHATTING__MESSAGE_COLL.countDocuments({ ...condition, type: 2 });
					let totalLinkPromise = CHATTING__MESSAGE_COLL.countDocuments({ ...condition, type: 3 });

					let [totalImage, totalFile, totalLink] = await Promise.all([totalImagePromise, totalFilePromise, totalLinkPromise])

					if(totalImage || totalFile || totalLink){
						return { infoMember: member, totalImage, totalFile, totalLink };
					}
				});

				listMemberSendMediaInConversation = (await Promise.all(listMemberSendMediaInConversation)).filter(Boolean);

				return resolve({ error: false, data: listMemberSendMediaInConversation, status: 200 })
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật trạng thái ẩn cuộc hội thoại của 1 user
	 * Date: 14/08/2021
	 */
	updateHideConversation({ conversationID, userID, isHide }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				let infoAfterUpdated = null;
				if(isHide === "true"){
					infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$addToSet: { usersHide: userID }
					}, { new: true })
				} else{
					infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$pull: { usersHide: userID }
					}, { new: true })
				}

				if(!infoAfterUpdated)
					return resolve({ error: true, message: "Can't update hide conversation", status: 403 });

				return resolve({ error: false, data: infoAfterUpdated, status: 200 })
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật on/off thông báo cuộc hội thoại của 1 user
	 * Date: 14/08/2021
	 */
	updateMuteConversation({ conversationID, userID, isMute, timeMute, jobID, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				let infoAfterUpdated = null;
				let dataAddToSet = {
					usersMute: { userID }
				};

				if(isMute === "true"){
					infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
						_id: conversationID,
						usersMute: {
							$not: {
								$elemMatch: { userID }
							}
						}
					}, {
						$addToSet: dataAddToSet
					}, { new: true })
				} else{
					infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findOneAndUpdate({ _id: conversationID }, {
						$pull: { usersMute: { userID } }
					}, { new: true })
				}

				if(!infoAfterUpdated)
					return resolve({ error: true, message: "Can't update mute conversation or user existed in users mute", status: 403 });

				if(isMute === "true" && timeMute){
					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_MUTE_CONVERSATION}`, {
						conversationID,
						timeMute,
						userID,
					});
				} else{
					console.log('REMOVE JOB MUTE CONVERSATION', jobID);
					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.REMOVE_JOB_MUTE_CONVERSATION}`, {
						jobID
					});
				}

				return resolve({ error: false, data: infoAfterUpdated, status: 200 })
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Đánh dấu đã đọc cuộc hội thoại của 1 user
	 * Date: 14/08/2021
	 */
 	markReadConversation({ conversationID, userID }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				let infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
					_id: conversationID,
					usersMissMessage: {
						$elemMatch: { userID }
					}
				}, {
					$set: {
						"usersMissMessage.$.amount": 0
					}
				}, { new: true })

				if(!infoAfterUpdated)
					return resolve({ error: true, message: "Can't mark read conversation", status: 403 });

				return resolve({ error: false, data: infoAfterUpdated, status: 200 })
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Member rời khỏi cuộc hội thoại
	 * Date: 14/08/2021
	 */
	memberLeaveConversation({ conversationID, userID }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				let pullObj = { members: userID };
				if(checkExistConversation.authors.includes(userID)){
					pullObj.authors = userID;
				}

				await CHATTING__MESSAGE_MODEL.insertMessage({
					conversationID, 
					senderID: userID,
					type: 107,
					usersAssigned: [userID],
					receiversID: checkExistConversation.members,
				})

				let infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$pull: pullObj
				}, { new: true })

				if(!infoAfterUpdated)
					return resolve({ error: true, message: "Can't leave conversation", status: 403 });

				return resolve({ error: false, data: infoAfterUpdated, status: 200 })
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Giải tán cuộc hội thoại (xóa nhóm)
	 * Date: 14/08/2021
	 */
	deleteConversation({ conversationID, userID }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					authors: { $in: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't author of conversation", status: 403 });

				if(checkExistConversation.authors[0].toString() !== userID.toString())
					return resolve({ error: true, message: "You are't root author of conversation (can't delete conversation)", status: 403 });

				let infoAfterDelete = await CHATTING__CONVERSATION_COLL.findByIdAndDelete(conversationID);

				if(!infoAfterDelete)
					return resolve({ error: true, message: "Can't delete conversation", status: 403 });

				return resolve({ 
					error: false, 
					data: { 
						infoAfterDelete, 
						infoConversation: checkExistConversation
					}, 
					status: 200
				})
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH
	 * Func: Xoá lịch sử cuộc hội thoại
	 * Date: 15/08/2021
	 */
	deleteHistoryConversation({ conversationID, userID }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				// Pull current user in array usersDeleteHistory if usersDeleteHistory.length > 0
				await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
					_id: conversationID,
					usersDeleteHistory: {
						$exists: true,
						$not: { $size: 0 }
					}
				}, {
					$pull: {
						usersDeleteHistory: { userID } 
					}
				})

				// Push current user into array usersDeleteHistory
				let infoAfterDelete = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$push: {
						usersDeleteHistory: {
							userID,
							lastMessage: checkExistConversation.lastMessage,
							time: Date.now()
						}
					}
				}, { new: true });

				if(!infoAfterDelete)
					return resolve({ error: true, message: "Can't delete history conversation", status: 403 });

				return resolve({ error: false, data: infoAfterDelete, status: 200 })
			} catch(error){
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách cuộc hội thoại (hoặc tìm kiếm theo tên)
	 * Date: ...
	 * Updated: MinhVH - 23/08/2021
	 */
	getListConversationWithPage({ lastestConversationID, userID, key }){
        return new Promise(async resolve => {
            try {
				// Check params
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if(lastestConversationID && !checkObjectIDs(lastestConversationID))
					return resolve({ error: true, message: 'Request params lastestConversationID invalid', status: 400 });

                let page 	= 1;
                let perPage = 20;

                if(lastestConversationID && checkObjectIDs(lastestConversationID)){
                    page = 2;
                }

				let conditionObj = { members: { $in: [userID] } };
				let objSort 	 = {};
                let sortBy = {
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

                    conditionObj = dataPagingAndSort.data.find;
                }

				// SEARCH TEXT
				if(key){
					conditionObj.$text = { $search: key };
					objSort.score = { $meta: "textScore" };
					sortBy.score = { $meta: "textScore" };
				}

                let listConversation = await CHATTING__CONVERSATION_COLL.find(conditionObj, objSort)
					.populate({
						path: 'lastMessage', 
						select: 'modifyAt  createAt sender content status', 
						populate: { 
							path: 'sender', 
							select: '_id fullname image company'
						}
					})
					.limit(perPage)
					.sort(sortBy)
					.lean();

                // let totalConversationPagePromise    = CHATTING__CONVERSATION_COLL.count({ members: { $in: [ObjectID(authorID)] } });
                // let totalCheckExCurrentPagePromise  = CHATTING__CONVERSATION_COLL.count(conditionObj);

				// const { currentPage, totalPage } = await calculateCurrentPage({
				// 	totalPagePromise: totalConversationPagePromise,
				// 	totalCurrentPagePromise: totalCheckExCurrentPagePromise,
				// 	perPage
				// })

                return resolve({ 
					error: false,
					status: 200,
					data: { 
						listConversation, 
						perPage,
						// currentPage,
						// totalPage
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

}

exports.MODEL = new Model;