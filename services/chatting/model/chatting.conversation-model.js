"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;
const moment										= require('moment');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_AUTH } 							= require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_REMINDER } 						= require('../../reminder/helper/reminder.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, IsJsonString }				= require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const CHATTING__MESSAGE_COLL						= require('../database/chatting.message-coll');
const CHATTING__CONVERSATION_COLL               	= require('../database/chatting.conversation-coll');
const CHATTING__CONVERSATION_FILE_COLL          	= require('../database/chatting.conversation_file-coll');
const CHATTING__CONVERSATION_LINK_COLL          	= require('../database/chatting.conversation_link-coll');

/**
 * MODELS
 */
const CHATTING__MESSAGE_MODEL  						= require('../model/chatting.message-model').MODEL;


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
					let checkExistConversation = await CHATTING__CONVERSATION_COLL
						.findOne({
							members: {
								$all: [authorID, ...membersID],
								$size: 2
							},
						})
						.lean()

					if(checkExistConversation)
						return resolve({ error: false, data: checkExistConversation, status: 200 });

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
					members: [...new Set([authorID, ...membersID])]
				});
                if(!infoConversationAfterInserted)
                    return resolve({ error: true, message: "Can't create conversation", status: 403 });

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

				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member of conversation", status: 403 });

				// Check cấu hình admin cuộc hội thoại
				if(checkExistConversation.config && checkExistConversation.config.configEditInfo === 2){
					const listAuthorsID = checkExistConversation.authors.map(author => author.toString());
					// User is not author of conversation
					if(!listAuthorsID.includes(userID))
						return resolve({ error: true, message: "You don't have permission to edit conversation", status: 403 });
				}

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

				let infoAfterUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
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
	addMembersToConversation({ conversationID, authorID, membersID }) {
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
						return resolve({
							error: true,
							message: `Member ${member.bizname || member.fullname} is existed in conversation`,
							status: 403
						});
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
				let usersMissMessage = membersID.map(memberID => ({ userID: memberID, amount: 0 }));

				await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$addToSet: { usersMissMessage }
				});

				// Check cấu hình admin cuộc hội thoại
				if(checkExistConversation.config && checkExistConversation.config.configSeeOldMessage === 2){
					// INSERT USER DELETE HISTORY
					let usersDeleteHistory = membersID.map(memberID => ({
						userID: memberID,
						lastMessage: checkExistConversation.lastMessage,
						time: Date.now()
					}));

					await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$addToSet: { usersDeleteHistory }
					});
				}

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
						usersMissMessage: { userID: memberID },
						usersDeleteHistory: { userID: memberID }
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
                    return resolve({ error: true, message: "You aren't author conversation", status: 403 });

				let infoConversationAfterUpdated = null;
				let typeMessage = 0;

				// Cập nhật member thành admin
				if(isSetAdmin){
					if(checkExistConversation.authors.includes(memberID))
						return resolve({ error: true, message: "Member is already an author", status: 403 });

					infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$addToSet: {
							authors: memberID
						}
					}, { new: true });

					typeMessage = 105; // Xét thêm admin cuộc hội thoại

				} else{ // Cập nhật admin thành member
					if(checkExistConversation.authors[0].toString() === memberID.toString())
						return resolve({ error: true, message: "Can't remove author root", status: 403 });

					infoConversationAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$pull: {
							authors: memberID
						},
					}, { new: true });

					typeMessage = 106; // Xoá bỏ quyền admin của member trong cuộc hội thoại
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
                return resolve({ error: true, message: error.message, status: 500 });
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
                    return resolve({ error: true, message: "You aren't author conversation", status: 403 });

				let dataUpdate = { config: checkExistConversation.config };
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
						dataUpdate.config['configHighlight']		= +valueConfig;
						break;
					case 2:
						dataUpdate.config['configSeeOldMessage'] 	= +valueConfig;
						break;
					case 3:
						dataUpdate.config['configEditInfo'] 		= +valueConfig;
						break;
					case 4:
						dataUpdate.config['configCreateNote'] 		= +valueConfig;
						break;
					case 5:
						dataUpdate.config['configCreatePoll'] 		= +valueConfig;
						break;
					case 6:
						dataUpdate.config['configPinMessage'] 		= +valueConfig;
						break;
					case 7:
						dataUpdate.config['configSendMessage'] 		= +valueConfig;
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
					return resolve(infoUserAfterUpdated);

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
    getInfoConversationByID({ conversationID, userID, filter = {}, select = {} }){
        return new Promise(async resolve => {
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

                let infoConversation = await CHATTING__CONVERSATION_COLL
					.findOne({
						_id: conversationID,
						members: { $in: [userID] }
					}, filter)
					.populate({
						path: 'members',
						select: select.members
					})
					.populate({
						path: 'authors',
						select: select.authors
					})
					.populate('lastMessage', select.lastMessage)
					.populate('messagesPin', select.messagesPin)
					.populate({
						path: 'avatar',
						populate: {
							path: 'file',
							select: 'name url size'
						},
						select: select.avatar
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
							{ members: { $exists: false }},
							{ members: { $size: 0 }},
							{ members: { $size: 2 }}
						]
					})
					.select('_id name description authors avatar')
					.populate({
						path: 'avatar authors',
						select: '_id fullname username image',
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
							{ members: { $exists: false }},
							{ members: { $size: 0 }},
							{ members: { $size: 2 }}
						]
					})
					.select('_id name description authors avatar')
					.populate({
						path: 'avatar authors',
						select: '_id fullname username image',
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
	getListMembersConversationByID({ conversationID, userID, select = {} }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([conversationID, userID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

                const infoConversation = await CHATTING__CONVERSATION_COLL
					.findOne({
						_id: conversationID,
						members: { $in: [userID] }
					})
					.populate({
						path: 'members',
						select: select.members
					})
                    .lean();

                if (!infoConversation)
                    return resolve({ error: true, message: "You aren't member of conversation", status: 403 });

                return resolve({
					error: false,
					data: {
						listRecords: infoConversation.members,
						totalRecord: infoConversation.members.length
					},
					status: 200
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách tin nhắn cuộc hội thoại (tìm kiếm tin nhắn, phân trang)
	 * Date: 11/08/2021
	 * Hàm chuẩn về lấy danh sách mẩu tin
	 */
	getListMessagesConversationWithPage({ conversationID, lastestID, userID, keyword, limit = 15, filter = {}, select = {} }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				if(isNaN(limit)) {
					limit = 15;
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

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You aren't member", status: 403 });

				// Init condition object
				let conditionObj 	= { conversation: conversationID };
				let conditionFind 	= {};
				let objSort 	 	= {};
				let sortBy = {
					modifyAt: -1,
					createAt: -1
				};

				// GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoMessage = await CHATTING__MESSAGE_COLL.findById(lastestID);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoMessage.createAt}_${infoMessage._id}`;
					let keys	 = ['createAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

				// CHECK USER DELETE HISTORY
				if(checkExistConversation.usersDeleteHistory && checkExistConversation.usersDeleteHistory.length){
					let checkExistInUserDeleteHistory = checkExistConversation.usersDeleteHistory.find(user => user.userID.toString() === userID)

					if(checkExistInUserDeleteHistory){
						conditionObj._id = { $gt: checkExistInUserDeleteHistory.lastMessage };
					}
				}

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

				let listMessages = await CHATTING__MESSAGE_COLL.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
					.populate('sender', select.sender)
					.populate('usersSeen', select.usersSeen)
					.populate('usersAssigned', select.usersAssigned)
					.populate('receivers', select.receivers)
					.populate('parent', select.parent)
					.populate({
						path: 'poll',
						populate: {
							path: 'options.usersVote',
							select: '_id bizname fullname image'
						},
						select: select.poll
					})
					.populate('reminder', select.reminder)
					.populate({
						path: 'files.file',
						populate: {
							path: 'file',
							select: 'name url size'
						},
						select: select.files
					})
					.sort(sortBy)
					.limit(limit + 1)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await CHATTING__MESSAGE_COLL.countDocuments(conditionObj);
				let nextCursor  = null;

				if(listMessages && listMessages.length){
					if(listMessages.length > limit){
						nextCursor = listMessages[limit - 1]._id;
						listMessages.length = limit;
					}

					if(!keyword){
						listMessages = listMessages.reverse();
						nextCursor	 = listMessages[0]._id;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listMessages,
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
	 * Func: Tìm kiếm tin nhắn cuộc hội thoại (Dữ liệu trả về là 5 tin nhắn trước và sau tin nhắn tìm thấy)
	 * Date: 23/08/2021
	 */
	searchMessageConversationById({ conversationID, userID, messageID, filter = {}, select = {} }){
		return new Promise(async resolve => {
			try {
				// Check params
				if(!checkObjectIDs([conversationID, messageID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

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

				let infoMessage = await CHATTING__MESSAGE_COLL
					.findOne(conditionObjSearchMessage, filter)
					.populate('sender', select.sender)
					.populate('usersSeen', select.usersSeen)
					.populate('receivers', select.receivers)
					.populate('usersAssigned', select.usersAssigned)
					.populate('parent', select.parent)
					.populate('poll', select.poll)
					.populate('reminder', select.reminder)
					.populate({
						path: 'files.file',
						populate: {
							path: 'file',
							select: 'name url size'
						},
						select: select.files
					})
					.lean();

				if(!infoMessage)
					return resolve({ error: true, message: "Can't get info message", status: 400 });

				let listMessagesFront = await CHATTING__MESSAGE_COLL.find(conditionObjFrontList, filter)
					.populate('sender', select.sender)
					.populate('usersSeen', select.usersSeen)
					.populate('receivers', select.receivers)
					.populate('usersAssigned', select.usersAssigned)
					.populate('parent', select.parent)
					.populate('poll', select.poll)
					.populate('reminder', select.reminder)
					.populate({
						path: 'files.file',
						populate: {
							path: 'file',
							select: 'name url size'
						},
						select: select.files
					})
					.sort(_sort)
					.limit(5)
					.lean();

				let listMessagesBack = await CHATTING__MESSAGE_COLL.find(conditionObjBackList, filter)
					.populate('sender', select.sender)
					.populate('usersSeen', select.usersSeen)
					.populate('receivers', select.receivers)
					.populate('usersAssigned', select.usersAssigned)
					.populate('parent', select.parent)
					.populate('poll', select.poll)
					.populate('reminder', select.reminder)
					.populate({
						path: 'files.file',
						populate: {
							path: 'file',
							select: 'name url size'
						},
						select: select.files
					})
					.sort(_sort)
					.limit(5)
					.lean();

				let listMessages = [...listMessagesFront.reverse(), infoMessage, ...listMessagesBack.reverse()];

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listMessages,
						totalRecord: listMessages.length
					}
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
		conversationID, userID, typeMessage, senderID, dateCreate, fromDate, toDate, page = 1, limit = 10
	}){
		return new Promise(async resolve => {
			try {
				if(isNaN(typeMessage))
					return resolve({ error: true, message: "Request param typeMessage invalid", status: 400 });

				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				// Check user exist in conversation
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				if(!page || isNaN(page))
					page = 1;

				if(!limit || isNaN(limit))
					limit = 10;

				page  		= +page;
				limit 		= +limit;
				typeMessage = +typeMessage;

				let conditionObj = {
					conversation: ObjectID(conversationID)
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
				}

				let listMedia 	= [];
				let totalRecord	= 0;

				// MESSAGE LINK
				if(typeMessage === 3){
					groupObj = {
						...groupObj,
						messages: {
							$push: {
								_id: "$_id",
								link: "$link",
							}
						},
					}

					let pipeline = [
						{ $match: conditionObj },
						{ $group: groupObj },
						{
							$facet: {
								records: [
									{ $sort: { "_id": -1 } },
									{ $skip: (page * limit) - limit },
									{ $limit: limit },
								],
								pageInfo: [
									{ $group: { _id: null, count: { $sum: 1 } } },
								],
							},
						},
					]

					listMedia = await CHATTING__CONVERSATION_LINK_COLL.aggregate(pipeline);

					if(!listMedia || !listMedia.length)
						return resolve({ error: true, message: "Can't get list message", status: 404 });

					totalRecord = listMedia[0]?.pageInfo[0]?.count;
					listMedia = listMedia[0].records;

				} else{
					// MESSAGE FILE, IMAGE
					groupObj = {
						...groupObj,
						messages: {
							$push: {
								_id: "$_id",
								type: "$type",
								files: "$files",
							}
						},
					}

					let pipeline = [
						{
							$match: {
								...conditionObj,
								type: typeMessage
							}
						},
						{ $group: groupObj },
						{
							$facet: {
								records: [
									{ $sort: { "_id": -1 } },
									{ $skip: (page * limit) - limit },
									{ $limit: limit },
								],
								pageInfo: [
									{ $group: { _id: null, count: { $sum: 1 } } },
								],
							},
						},
					]

					listMedia = await CHATTING__MESSAGE_COLL.aggregate(pipeline);

					if(!listMedia || !listMedia.length)
						return resolve({ error: true, message: "Can't get list message", status: 404 });

					totalRecord = listMedia[0]?.pageInfo[0]?.count;
					listMedia = listMedia[0].records;

					if(listMedia && listMedia.length){
						listMedia = listMedia.map(async media =>{
							let listMessage = media.messages.map(message => CHATTING__MESSAGE_COLL
								.findOne({ _id: message._id })
								.select('_id files.file')
								.populate({
									path: 'files.file',
									select: '_id file',
									populate: {
										path: 'file',
										select: '_id name url size'
									}
								})
								.lean());

							listMessage = await Promise.all(listMessage);
							let messages = [];

							for (const message of listMessage) {
								if(message.files && message.files.length){
									for (const fileInfo of message.files) {
										messages[messages.length] = fileInfo?.file?.file;
									}
								}
							}

							return { ...media, messages };
						})

						listMedia = await Promise.all(listMedia);
					}

				}

				return resolve({
					error: false,
					data: {
						listRecords: listMedia,
						limit: +limit,
						totalRecord,
						page
					},
					status: 200,
				})
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
	getListMemberSendMessagesMediaConversation({ conversationID, userID, select = {} }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID]))
					return resolve({ error: true, message: "Request param invalid", status: 400 });

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

				let checkExistConversation = await CHATTING__CONVERSATION_COLL
					.findOne({
						_id: conversationID,
						members: { $all: [userID] }
					})
					.populate('members', select.infoMember)
					.lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "You are't member of conversation", status: 403 });

				let listMemberSendMediaInConversation = checkExistConversation.members.map(async member => {
					let condition = { conversation: conversationID, sender: member._id };
					let totalImagePromise = CHATTING__MESSAGE_COLL.countDocuments({ ...condition, type: 1 });
					let totalFilePromise = CHATTING__MESSAGE_COLL.countDocuments({ ...condition, type: 2 });
					let totalLinkPromise = CHATTING__CONVERSATION_LINK_COLL.countDocuments({ ...condition });

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
				if(isHide){
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
	updateMuteConversation({ conversationID, userID, isMute, timeMute, ctx }){
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

				if(isMute){
					infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$addToSet: {
							usersMute: userID
						}
					}, { new: true })
				} else{
					infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$pull: {
							usersMute: userID
						}
					}, { new: true })
				}

				if(!infoAfterUpdated)
					return resolve({ error: true, message: "Can't update mute conversation", status: 403 });

				if((isMute && !timeMute) || !isMute){
					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.DELETE_JOB_MUTE_CONVERSATION}`, {
						conversationID,
						userID
					});
				}

				if(isMute && timeMute){
					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.DELETE_JOB_MUTE_CONVERSATION}`, {
						conversationID,
						userID
					});

					await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_MUTE_CONVERSATION}`, {
						conversationID,
						timeMute,
						userID,
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

				let infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$pull: pullObj
				}, { new: true })

				if(!infoAfterUpdated)
					return resolve({ error: true, message: "Can't leave conversation", status: 403 });

				await CHATTING__MESSAGE_MODEL.insertMessage({
					conversationID,
					senderID: userID,
					type: 107,
					usersAssigned: [userID],
					receiversID: checkExistConversation.members,
				})

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
					return resolve({ error: true, message: "You are't root author of conversation (access denined)", status: 403 });

				let infoAfterDelete = await CHATTING__CONVERSATION_COLL.findByIdAndDelete(conversationID);

				if(!infoAfterDelete)
					return resolve({ error: true, message: "Can't delete conversation", status: 403 });

				return resolve({
					error: false,
					status: 200,
					data: infoAfterDelete,
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
	 * Dev: MinhVH
	 * Func: Lấy danh sách cuộc hội thoại (hoặc tìm kiếm theo tên)
	 * Date: 23/08/2021
	 */
	getListConversationWithPage({ lastestID, userID, keyword, limit = 20, filter = {}, select = {}, ctx }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if(isNaN(limit)) {
					limit = 20;
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

				let conditionObj 	= { members: { $in: [userID] } };
				let conditionFind 	= {};
				let objSort 	 	= {};
                let sortBy = {
                    modifyAt: -1,
					createAt: -1,
					updateAt: -1
                }

				// GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoConversation = await CHATTING__CONVERSATION_COLL.findById(lastestID);
                    if(!infoConversation)
                        return resolve({ error: true, message: "Can't get info last conversation", status: 403 });

                    let nextInfo = `${infoConversation.modifyAt}_${infoConversation._id}`;
                    let keys 	 = ['modifyAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 403 });

					conditionFind = dataPagingAndSort.data.find;
                }

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

				let listConversationPin = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_PIN_CONVERSATION}`, {
					userID
				});

				if(listConversationPin.data && listConversationPin.data.length){
					conditionObj._id = { $nin: listConversationPin.data };

					listConversationPin = await CHATTING__CONVERSATION_COLL
						.find({ _id: { $in: listConversationPin.data } }, filter)
						.populate('members', select.members)
						.populate({
							path: 'lastMessage',
							populate: {
								path: 'sender',
								select: select.sender,
							},
							select: select.lastMessage,
						})
						.populate({
							path: 'avatar',
							populate: {
								path: 'file',
								select: 'name size url'
							},
							select: select.avatar
						})
						.lean()
				} else{
					listConversationPin = [];
				}

                let listConversation = await CHATTING__CONVERSATION_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
					.populate('members', select.members)
					.populate({
						path: 'lastMessage',
						populate: {
							path: 'sender',
							select: select.sender,
						},
						select: select.lastMessage,
					})
					.populate({
						path: 'avatar',
						populate: {
							path: 'file',
							select: 'name size url'
						},
						select: select.avatar
					})
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await CHATTING__CONVERSATION_COLL.count(conditionObj);
				let nextCursor	= null;

				if(listConversation && listConversation.length){
					if(listConversation.length > limit){
						nextCursor = listConversation[limit - 1]._id;
						listConversation.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listConversationPin,
						listRecords: listConversation,
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
	 * Func: Lấy danh sách cuộc hội thoại chưa đọc
	 * Date: 09/09/2021
	 */
    getListConversationMissMessage({ userID, lastestID, limit = 20, filter = {}, select = {} }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs([userID]))
					return resolve({ error: true, message: 'Request param userID invalid', status: 400 });

				if(isNaN(limit)){
					limit = 20;
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
				let conditionObj  = {
					members: { $in: [userID] },
					usersMissMessage: {
						$elemMatch: {
							userID,
							amount: { $gt: 0 }
						}
					}
				};
                let sortBy = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
                };

                if(lastestID && checkObjectIDs(lastestID)){
					let infoConversation = await CHATTING__CONVERSATION_COLL.findById(lastestID);
                    if(!infoConversation)
                        return resolve({ error: true, message: "Can't get info last conversation", status: 403 });

                    let nextInfo = `${infoConversation.modifyAt}_${infoConversation._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
                }

                let listConversationMissMessage = await CHATTING__CONVERSATION_COLL
					.find({ ...conditionObj, ...conditionFind }, filter)
					.populate({
						path: 'lastMessage',
						populate: {
							path: 'sender',
							select: select.sender,
						},
						select: select.lastMessage,
					})
					.populate({
						path: 'avatar',
						populate: {
							path: 'file',
							select: 'name size url'
						},
						select: select.avatar
					})
					.limit(limit + 1)
					.sort(sortBy);

				// GET TOTAL RECORD
				let totalRecord = await CHATTING__CONVERSATION_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listConversationMissMessage && listConversationMissMessage.length){

					if(listConversationMissMessage.length > limit){
						nextCursor = listConversationMissMessage[limit - 1]._id;
						listConversationMissMessage.length = limit;
					}

				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listConversationMissMessage,
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

}

exports.MODEL = new Model;
