"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 							= require('../../auth/helper/auth.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, IsJsonString }				= require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const CHATTING__CONVERSATION_GROUP_COLL				= require('../database/chatting.conversation_group-coll');
const CHATTING__CONVERSATION_COLL               	= require('../database/chatting.conversation-coll');

/**
 * MODELS
 */
const CHATTING__MESSAGE_MODEL  						= require('./chatting.conversation-model').MODEL;


class Model extends BaseModel {

    constructor() {
        super(CHATTING__CONVERSATION_GROUP_COLL);
    }

	 /**
	 * Dev: MinhVH
	 * Func: Thêm folder mới
	 * Date: 11/02/2022
	 */
	insert({ name, description, bizfullname, authorID, membersID, isPrivate, ctx }) {
        return new Promise(async (resolve) => {
            try {
				if(!checkObjectIDs([authorID, ...membersID]) || !membersID || !membersID.length) {
					return resolve({ 
						error: true, 
						message: 'Tham số authorID or membersID không hợp lệ', 
						keyError: 'params_authorID_or_membersID_invalid',
						status: 400 
					});
				}

				// Tạo cuộc hội thoại 2 người
				if(isPrivate){
					if(membersID.length > 1) {
						return resolve({ 
							error: true, 
							message: 'Cuộc hội thoại riêng tư không được lớn hơn 1 thành viên', 
							keyError: 'number_of_members_must_equal_1',
							status: 400
						});
					}

					// Kiểm tra nếu tồn tại cuộc hội thoại của hai người hoặc chính mình thì không tạo nữa
					let checkExistConversation = await CHATTING__CONVERSATION_COLL
						.findOne({
							$or: [
								{ members: [authorID, ...membersID] },
								{ members: [...membersID, authorID] },
								{ members: [...new Set([authorID, ...membersID])] },
							]
							// members: {
							// 	$all: [ObjectID(authorID), ...membersID],
							// 	$size: 2
							// },
						})
						.lean();

					if(checkExistConversation)
						return resolve({ error: false, data: checkExistConversation, status: 200 });

					let infoMember = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
						userID: membersID[0],
						select: 'bizfullname'
					});

					if(infoMember.error) {
						return resolve({ 
							error: true, 
							message: 'Không tìm thấy thành viên', 
							keyError: 'cannot_get_info_member',
							status: 400
						});
					}

					name = `${bizfullname}_${infoMember?.data?.bizfullname}`;

				} else{ // Tạo cuộc hội thoại nhiều hơn hai người ( Nhóm chat )
					if(membersID.length <= 1) {
						return resolve({ 
							error: true, 
							message: 'Số lượngg thành viên của nhóm chat phải lớn hơn 1', 
							keyError: 'number_of_members_must_greater_than_1',
							status: 400
						});
					}

					if(membersID.length >= 100) {
						return resolve({ 
							error: true, 
							message: 'Số lượng thành viên không được lớn hơn 100', 
							keyError: 'number_of_members_over_100',
							status: 400
						});
					}
				}

                let infoConversationAfterInserted = await this.insertData({
					name,
					description,
					isPrivate,
					authors: [authorID],
					members: [...new Set([authorID, ...membersID])]
				});

                if(!infoConversationAfterInserted) {
					return resolve({ 
						error: true, 
						message: 'Đã xảy ra lỗi', 
						keyError: 'error_occurs',
						status: 422
					});
				}

                return resolve({ error: false, data: infoConversationAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật folder
	 * Date: 11/02/2022
	 */
	update({ conversationID, userID, name, description, avatar }) {
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([conversationID, userID])) {
					return resolve({ 
						error: true, 
						message: "Tham số conversation ID không hợp lệ", 
						keyError: 'params_conversationID_or_userID_invalid',
						status: 403
					});
				}

				let checkExistConversation = await CHATTING__CONVERSATION_COLL.findOne({
					_id: conversationID,
					members: { $in: [userID] }
				}).lean();

				if(!checkExistConversation) {
					return resolve({ 
						error: true, 
						message: "Bạn không phải thành viên cuộc hội thoại", 
						keyError: 'you_are_not_member_of_conversation',
						status: 403
					});
				}

				// Check cấu hình admin cuộc hội thoại
				if(checkExistConversation.config && checkExistConversation.config.configEditInfo === 2){
					const listAuthorsID = checkExistConversation.authors.map(author => author.toString());
					// User is not author of conversation
					if(!listAuthorsID.includes(userID)) {
						return resolve({ 
							error: true, 
							message: "Bạn không có quyền chỉnh sửa cuộc hội thoại", 
							keyError: 'you_do_not_permission_to_edit_conversation',
							status: 403
						});
					}
				}

				let infoMessageNotification = null;
				let dataUpdate 	= {};
				name 		&& (dataUpdate.name 		= name);
                description && (dataUpdate.description 	= description);

				// Cập nhật avatar cuộc hội thoại
				if(avatar && checkObjectIDs(avatar)){
					dataUpdate.avatar = avatar;
				}

				let infoAfterUpdate = await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
					$set: dataUpdate
				}, { new: true });

				if(!infoAfterUpdate) {
					return resolve({ 
						error: true, 
						message: "Có lỗi xảy ra", 
						keyError: 'error_occurs',
						status: 422
					});
				}

				if(name){
					infoMessageNotification = await CHATTING__MESSAGE_MODEL.insertMessage({
						senderID: userID,
						receiversID: infoAfterUpdate.members,
						conversationID,
						type: 103
					})

					await CHATTING__CONVERSATION_COLL.findByIdAndUpdate(conversationID, {
						$set: { isRename: true }
					});
				}

				if(avatar){
					infoMessageNotification = await CHATTING__MESSAGE_MODEL.insertMessage({
						senderID: userID,
						receiversID: infoAfterUpdate.members,
						conversationID,
						type: 104
					})
				}

				return resolve({ 
					error: false, 
					data: {
						infoConversation: infoAfterUpdate,
						infoMessage: infoMessageNotification
					}, 
					status: 200
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: VinhHV
	 * Func: Lấy thông tin folder
	 * Date: 11/02/2022
	 */
    getInfo({ groupID, select, populates, authorID }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([groupID, authorID])) {
					return resolve({
						error: true,
						message: "Tham số group ID hoặc author ID không hợp lệ",
						keyError: "params_groupID_or_authorID_invalid",
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

				let infoGroup = await CHATTING__CONVERSATION_GROUP_COLL
					.findById(groupID)
					.select(select)
					.populate(populates)
					.lean();

                if (!infoGroup) {
					return resolve({
						error: true,
						message: "Không thể lấy thông tin folder",
						keyError: "can_not_get_info_group",
						status: 422
					})
				}

                return resolve({ error: false, data: infoGroup, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách folder
	 * Date: 11/02/2022
	 */
	getList({ lastestID, keyword, limit = 10, select, populates, authorID }){
		return new Promise(async resolve => {
			try {
				let conditionObj = { author: authorID };
                let sortBy = { createAt: -1 };
                let keys = ['createAt__-1', '_id__-1'];

				if(!checkObjectIDs([groupID, authorID])) {
					return resolve({
						error: true,
						message: "Tham số group ID hoặc author ID không hợp lệ",
						keyError: "params_groupID_or_authorID_invalid",
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

				if(isNaN(limit) || +limit > 20) {
					limit = 10;
				} else{
					limit = +limit;
				}

				let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CHATTING__CONVERSATION_GROUP_COLL.findById(lastestID);
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

				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

				let listGroups = await CHATTING__CONVERSATION_GROUP_COLL
					.find(conditionObj)
					.limit(limit + 1)
					.sort(sortBy)
					.select(select)
					.populate(populates)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await CHATTING__CONVERSATION_GROUP_COLL.countDocuments(conditionObjOrg);
				let nextCursor  = null;

				if(listGroups && listGroups.length){
					if(listGroups.length > limit){
						nextCursor = listGroups[limit - 1]._id;
						listGroups.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listGroups,
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
	 * Func: Xóa folder
	 * Date: 11/02/2022
	 */
	delete({ groupID, authorID }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([groupID, authorID])) {
					return resolve({
						error: true,
						message: "Tham số group ID hoặc author ID không hợp lệ",
						keyError: "params_groupID_or_authorID_invalid",
						status: 400,
					})
				}

				let infoAfterDelete = await CHATTING__CONVERSATION_GROUP_COLL.findByIdAndDelete(groupID);

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

}

exports.MODEL = new Model;
