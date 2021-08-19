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

				await CHATTING__MESSAGE_MODEL.insertMessage({
					senderID: authorID,
					receiversID: infoConversationAfterUpdated.members,
					membersAssigned: membersID,
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
                    $pullAll: pullMemberObj
                }, { new: true });

                if(!infoConversationAfterUpdated)
                    return resolve({ error: true, message: "Can't remove members in conversation", status: 403 });

				await CHATTING__MESSAGE_MODEL.insertMessage({
					senderID: authorID,
					receiversID: infoConversationAfterUpdated.members,
					membersAssigned: [memberID],
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
					membersAssigned: [memberID],
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
                if(!checkObjectIDs([conversationID, authorID]) || !['1','2'].includes(valueConfig))
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
	 * Func: Lấy danh sách member cuộc hội thoại
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
	 * Func: Lấy danh sách tin nhắn cuộc hội thoại ( phân trang)
	 * Date: ...
	 * Updated: MinhVH - 11/08/2021
	 */
	getListMessagesConversationWithPage({ conversationID, latestMessageID, userID, key }){
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
				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $all: [userID] }
				}).lean();

				if(!checkExistConversation)
					return resolve({ error: true, message: "Can't get info conversation", status: 403 });

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

				// if(timeMute && moment(timeMute).isValid()){
				// 	dataAddToSet = {
				// 		usersMute: {
				// 			userID,
				// 			time: new Date(timeMute)
				// 		}
				// 	}
				// }
				// console.log({ dataAddToSet })

				if(isMute === "true"){
					infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findOneAndUpdate({
						_id: conversationID,
						// "usersMute.user": userID,
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
	 * Func: Cập nhật on/off thông báo cuộc hội thoại của 1 user
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

				let infoAfterUpdated = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$pull: {
						usersMissMessage: { userID }
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
					type: 108,
					membersAssigned: [userID],
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

				// Pull current user in array usersDeleteHistory if exists
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

}

exports.MODEL = new Model;