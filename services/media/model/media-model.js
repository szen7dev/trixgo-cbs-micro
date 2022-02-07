"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_NOTIFICATION }				= require('../../notification/helper/notification.actions-constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_REACTION }					= require('../../reaction/helper/reaction.actions-constant');
const { MEDIA_TYPES, REACTION_TYPES }			= require('../helper/media.keys-constant');

/**
 * TOOLS
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 				= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, isEmptyObject, IsJsonString } = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const MEDIA_COLL					        	= require('../database/media-coll');
const MEDIA_REACTION_COLL					    = require('../database/media.reaction-coll');
const MEDIA_SAVE_COLL					    	= require('../database/media.save-coll');


class Model extends BaseModel {
    constructor() {
        super(MEDIA_COLL);
    }

	 /**
	 * Dev: NPNguyen 🐸
	 * Func: THÊM BÀI VIẾT MỚI
	 */
	insert({ authorID, title, content, type, location, files, tagFriends, images, background, companyID, departmentID, ctx }) {
        return new Promise(async (resolve) => {
            try {

				//=======================VARIABLE/CONSTANTS=====================
				let dataInsert = {};
				let dataUpdate = {};
				let receiversNoti = [];
				let conditionReceiver = {};

				//=========================VALIDATION==========================
				if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

				if (!MEDIA_TYPES.includes(type)) {
                    return resolve({ error: true, message: 'Request params type invalid', status: 400 });
				}

				dataInsert = {
					author: authorID,
					title,
					content,
				}

				switch (type) {
					case 'company':
						dataInsert.type = 1;
						break;
					case 'department':
						dataInsert.type = 2;
						break;
					case 'digital-conversion':
						dataInsert.type = 3;
						break;
					case 'system':
						dataInsert.type = 4;
						break;
					case 'just-me':
						dataInsert.type = 5;
						break;
					default:
						return resolve({ error: true, message: 'Request params type invalid', status: 400 });
				}

				if (location) {
					let locationOfMedia = {
						type: "Point", 
						coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
					}

					dataInsert.location = locationOfMedia;
				}

				if (tagFriends) {
					if(!checkObjectIDs(tagFriends))
                    	return resolve({ error: true, message: 'Request params tagFriends invalid', status: 400 });

					dataInsert.tagFriends = tagFriends;
				}

				if (companyID) {
					if(!checkObjectIDs(companyID))
                    	return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

					dataInsert.company = companyID;
				}

				if (departmentID) {
					if(!checkObjectIDs(departmentID))
                    	return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

					dataInsert.department = departmentID;
				}

				let infoMediaAfterInserted = await this.insertData(dataInsert);

                if(!infoMediaAfterInserted)
                    return resolve({ error: true, message: "Can't create media", status: 422 });

				// INSERT FILE GỌI QUA FILE CORE SERVICE
				let mediaID = infoMediaAfterInserted._id;

				if (background) {
					if(!checkObjectIDs(background))
						return resolve({ error: true, message: 'Request background media failed', status: 403 });

					dataUpdate.background = background;
				}

				if (files && files.length) {
					if(!checkObjectIDs(files))
						return resolve({ error: true, message: 'Request files media failed', status: 403 });

					dataUpdate.files = files;
				}

				if (images && images.length) {
					if(!checkObjectIDs(images))
						return resolve({ error: true, message: 'Request images media failed', status: 403 });

					dataUpdate.images = images;
				}

				if (!isEmptyObject(dataUpdate)) {
					infoMediaAfterInserted = await MEDIA_COLL.findByIdAndUpdate(mediaID, dataUpdate, { new: true });
				}

				switch (type) {
					case 'company':
						conditionReceiver = { company: companyID };
						break;
					case 'department':
						conditionReceiver = { department: departmentID };
						break;
					case 'digital-conversion':
						break;
					case 'system':
						break;
					case 'just-me':
						break;
					default:
						break;
				}

				if(Object.keys(conditionReceiver).length){
					const receivers = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_USER_WITH_CONDITION}`, {
						condition: { ...conditionReceiver, _id: { $nin: [authorID] } },
						select: '_id'
					});
	
					if(!receivers.error){
						const infoSender = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
							userID: authorID,
							select: 'fullname'
						});
						receiversNoti = receivers.data.map(receiver => receiver._id);

						ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
							title: `${infoSender?.data?.fullname} đã tạo 1 bài viết`,
							content: content.length > 200 ? content.substring(0, 200) : content,
							receivers: receiversNoti,
							path: `/social/post/${mediaID}`,
							type: 1
						});
					}
				}

                return resolve({ error: false, data: {
					infoMediaAfterInserted,
					receivers: receiversNoti
				}, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: CHỈNH SỬA BÀI VIẾT
	 */
	update({
		mediaID, authorID, title, content, type, location, files, tagFriends, images, background, companyID
	}) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
				let condition = {};

				//=========================VALIDATION==========================
				if(!checkObjectIDs(mediaID))
                    return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });

				if (!MEDIA_TYPES.includes(type)) {
                    return resolve({ error: true, message: 'Request params type invalid', status: 400 });
				}

				let infoMedia = await MEDIA_COLL.findById(mediaID);

				if (!infoMedia) {
                    return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });
				}

				if (infoMedia.author.toString() !== authorID.toString()) {
                    return resolve({ error: true, message: 'Permission denined', status: 403 });
				}

				condition = {
					title,
					content,
				}

				switch (type) {
					case 'company':
						condition.type = 1;
						break;
					case 'department':
						condition.type = 2;
						break;
					case 'digital-conversion':
						condition.type = 3;
						break;
					case 'system':
						condition.type = 4;
						break;
					case 'just-me':
						condition.type = 5;
						break;
					default:
						return resolve({ error: true, message: 'Request params type invalid', status: 400 });
				}

				if (location) {
					let locationOfMedia = {
						type: "Point", 
						coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
					}

					condition.location = locationOfMedia;
				}

				if (tagFriends) {
					if(!checkObjectIDs(tagFriends))
                    	return resolve({ error: true, message: 'Request params tagFriends invalid', status: 400 });

					condition.tagFriends = tagFriends;
				}

				if (companyID) {
					if(!checkObjectIDs(companyID))
                    	return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

					condition.company = companyID;
				}

				let infoMediaAfterInserted = await MEDIA_COLL.findByIdAndUpdate(mediaID, condition, { new: true });

                if(!infoMediaAfterInserted)
                    return resolve({ error: true, message: "Can't update media", status: 422 });

				// INSERT FILE GỌI QUA FILE CORE SERVICE
				let conditionObjUpdate = {};

				if (background) {
					if(!checkObjectIDs(background))
						return resolve({ error: true, message: 'Request background media failed', status: 403 });

					conditionObjUpdate.background = background;
				}

				if (files && files.length) {
					if(!checkObjectIDs(files))
						return resolve({ error: true, message: 'Request files media failed', status: 403 });

					conditionObjUpdate.files = files;
				} else{
					conditionObjUpdate.files = [];
				}

				if (images && images.length) {
					if(!checkObjectIDs(images))
						return resolve({ error: true, message: 'Request images media failed', status: 403 });

					conditionObjUpdate.images = images;
				} else{
					conditionObjUpdate.images = [];
				}

				if (!isEmptyObject(conditionObjUpdate)) {
					infoMediaAfterInserted = await MEDIA_COLL.findByIdAndUpdate(mediaID, conditionObjUpdate, { new: true });
				}

                return resolve({ error: false, data: infoMediaAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
	
	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH BÀI VIẾT 	
	 */
    getListMedia({ userID, lastestID, companyID, departmentID, mediaID, isRelated, type }){
        return new Promise(async resolve => {
            try {
				//=======================VARIABLE/CONSTANTS===================
				let conditionObj  = {};
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
				};

				//=======================VALIDATION===========================
				if(!checkObjectIDs(userID))
					return resolve({ error: true, message: 'Request param userID invalid', status: 400 });

				if(lastestID && !checkObjectIDs(lastestID))
					return resolve({ error: true, message: 'Request param lastestID invalid', status: 400 });

				// let infoUser = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
				// 	userID: userID,
				// 	select: "company fullname friends",
				// });

				conditionObj = {
					status: 1, //HOẠT ĐỘNG ✅
					// $or: [
					// 	{
					// 		author: userID, // Tác giả bài viết ✅
					// 	},
					// 	{
					// 		tagFriends: { // Được tag vào bài biết ✅ 
					// 			$in: [userID]
					// 		}
					// 	},
					// 	{
					// 		type: 1, //  Chỉ mình tôi ✅ 
					// 		author: userID,
					// 	},
					// 	{
					// 		type: 2, 
					// 		author: { // Bạn bè trong công ty ✅
					// 			$in: infoUser?.data?.friends
					// 		},
					// 		company: infoUser?.data?.company
					// 	},
					// 	{
					// 		type: 3, 
					// 		author: { // Tất cả bạn bè ✅
					// 			$in: infoUser?.data?.friends
					// 		}
					// 	}
					// ]
				}

				if(companyID && !checkObjectIDs(companyID)){
					return resolve({ 
						error: true, 
						message: 'Request param companyID invalid', 
						keyError: 'params_companyID_invalid',
						status: 400 
					});
				}

				if(departmentID && !checkObjectIDs(departmentID)){
					return resolve({ 
						error: true, 
						message: 'Request param departmentID invalid', 
						keyError: 'params_departmentID_invalid',
						status: 400 
					});
				}

				if(isRelated) {
					conditionObj._id = { $nin: [mediaID] };
				}

				switch (type) {
					case 'company':
						conditionObj.type = 1;
						conditionObj.company = companyID;
						break;
					case 'department':
						conditionObj.type = 2;
						conditionObj.company = companyID;
						break;
					case 'digital-conversion':
						conditionObj.type = 3;
						break;
					case 'system':
						conditionObj.type = 4;
						break;
					case 'just-me':
						conditionObj.type = 5;
						conditionObj.author = userID;
						break;
					case 'internal-company':
						conditionObj.type = { $in: [1,2] };
						conditionObj.company = companyID;
						break;
					default:
						return resolve({ error: true, message: 'Request params type invalid', status: 400 });
				}

                let listAfterFind = await this.getListWithCondition({
					conditionObj,
					limit: 10,
					sortBy,
					lastestID,
				});

				return resolve(listAfterFind);
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA BÀI VIẾT	
	 */
	remove({ mediaID, authorID }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(mediaID))
					return resolve({ error: true, message: 'Request param mediaID invalid', status: 400 });

				if(!checkObjectIDs(authorID))
					return resolve({ error: true, message: 'Request param authorID invalid', status: 400 });

				let infoMediaAfterDelete = await MEDIA_COLL.findOneAndDelete({
					_id: mediaID,
					author: authorID
				});

				if (!infoMediaAfterDelete) {
                    return resolve({ error: true, message: "Can't delete media", status: 422 });
				}

				return resolve({ 
					error: false,
					status: 200,
					data: infoMediaAfterDelete
				});
			} catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: THÔNG TIN BÀI VIẾT	
	 */
	getInfo({ mediaID }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(mediaID))
					return resolve({ error: true, message: 'Request param mediaID invalid', status: 400 });

				let infoMedia = await MEDIA_COLL
					.findById(mediaID)
					.populate({
						path: 'author',
						select: 'fullname company image',
						populate: { 
							path: 'company', 
							select: 'name'
						}
					})
					.populate({
						path: 'files',
						select: '_id name url size type',
					})
					.populate({
						path: 'images',
						select: '_id name url size type',
					})
					.populate({
						path: 'background',
						select: '_id name url size type',
					})
					.lean();

				if (!infoMedia) {
                    return resolve({ error: true, message: "Can't get info media", status: 403 });
				}

                // Cập nhật số lượng view
				await MEDIA_COLL.findByIdAndUpdate(mediaID, {
					$inc: {
						amountView: 1
					}
				})

				return resolve({ 
					error: false,
					status: 200,
					data: infoMedia
				});
			} catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: ĐÓNG GÓI RENDER BÀI VIẾT	
	 */
	getListWithCondition({ conditionObj, limit, sortBy, lastestID }) {
		return new Promise(async resolve => {
            try { 
				let conditionFind = {};

				if(isNaN(limit)){
					limit = 20;
				} else{
					limit = +limit;
				}

                if(lastestID && checkObjectIDs(lastestID)) {
					let infoMedia = await MEDIA_COLL.findById(lastestID);
                    if(!infoMedia)
                        return resolve({ error: true, message: "Can't get info last media", status: 403 });

                    let nextInfo = `${infoMedia.modifyAt}_${infoMedia._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
                }

				let listMedia = await MEDIA_COLL.find({ ...conditionObj, ...conditionFind })
					// .select("author content type location files tagFriends images background company")
					.populate({
						path: 'author',
						select: 'fullname company department position image',
						populate: { 
							path: 'company department', 
							select: 'name sign'
						}
					})
					.populate({
						path: 'files',
						select: '_id name url size type',
					})
					.populate({
						path: 'images',
						select: '_id name url size type',
					})
					.populate({
						path: 'background',
						select: '_id name url size type',
					})
					.populate({
						path: 'tagFriends',
						select: 'fullname',
					})
					.populate({
						path: 'company',
						select: 'name',
					})
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				let nextCursor	= null;
				if (listMedia && listMedia.length) {
					if(listMedia.length > limit){
						nextCursor = listMedia[limit - 1]._id;
						listMedia.length = limit;
					}
				}

				// GET TOTAL RECORD
				let totalRecord = await MEDIA_COLL.countDocuments(conditionObj);
				let totalPages = Math.ceil(totalRecord / limit);

				return resolve({ 
					error: false,
					status: 200,
					data: { 
						listRecords: listMedia, 
						limit: +limit,
						totalRecord,
						totalPages,
						nextCursor
					}
				});
			} catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH BÀI VIẾT ĐÃ LƯU
	 */
	getListSaveMedia({ userID, lastestID, limit, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
				let condition = {};
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
				};

				//=========================VALIDATION==========================
				if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if(!limit || isNaN(limit))
					limit = 10;

				limit = +limit;
			
				let	listMediaHavedSave = await MEDIA_SAVE_COLL.find({ userSave: { $in: userID },})

                if(!listMediaHavedSave)
                    return resolve({ error: true, message: "Can't get list media", status: 403 });

				let listAfterFind = await this.getListWithCondition({
					conditionObj: {
						_id: [...listMediaHavedSave.map(item => item.media)]
					},
					limit,
					sortBy,
					lastestID,
				});
				return resolve(listAfterFind);
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	 /**
	 * Dev: NPNguyen 🐸
	 * Func: LƯU BÀI VIẾT
	 */
	saveMedia({ author, mediaID, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
				let condition = {};

				//=========================VALIDATION==========================
				if(!checkObjectIDs([author]))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

				if (!checkObjectIDs([mediaID])) {
                    return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });
				}	

				let checkExisted = await MEDIA_COLL.findById(mediaID);
				if (!checkExisted) {
                    return resolve({ error: true, message: "Media don't exited", status: 400 });
				}

				condition = {
					userSave: author,
					media: mediaID,
				}

				// CHECK USER HAVE SAVED MEDIA
                let checkExistSaveMedia = await MEDIA_SAVE_COLL.findOne(condition).lean();

				if(checkExistSaveMedia) {
					return resolve({ error: true, message: 'You have already saved this post', status: 403 });
				}

				let infoMediaAfterInserted = await MEDIA_SAVE_COLL.create({ 
					...condition
				});

                if(!infoMediaAfterInserted)
                    return resolve({ error: true, message: "Can't save media", status: 403 });

                return resolve({ error: false, data: infoMediaAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA BÀI VIẾT ĐÃ LƯU
	 */
	deleteSaveMedia({ author, mediaID, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
				let condition = {};

				//=========================VALIDATION==========================
				if(!checkObjectIDs([author]))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

				if (!checkObjectIDs([mediaID])) {
                    return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });
				}	

				condition = {
					userSave: author,
					media: mediaID,
				}

				let infoMediaAfterDelete = await MEDIA_SAVE_COLL.findOneAndDelete({ 
					...condition
				});

                if(!infoMediaAfterDelete)
                    return resolve({ error: true, message: "Can't find saved media", status: 403 });

                return resolve({ error: false, data: infoMediaAfterDelete, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH BÀI VIẾT ĐÃ GHIM
	 */
	getListPinMedia({ userID, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=========================VALIDATION==========================
				if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				let listMediaPin = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_LIST_PIN_MEDIA}`);

				if(listMediaPin.data && listMediaPin.data.length){
					listMediaPin = await MEDIA_COLL
						.find({ _id: { $in: listMediaPin.data }})
						.populate({
							path: 'author',
							select: 'fullname company department image',
							populate: { 
								path: 'company department', 
								select: 'name sign'
							}
						})
						.populate({
							path: 'files',
							select: '_id name url size type',
						})
						.populate({
							path: 'images',
							select: '_id name url size type',
						})
						.populate({
							path: 'background',
							select: '_id name url size type',
						})
						.populate({
							path: 'tagFriends',
							select: 'fullname',
						})
						.populate({
							path: 'company',
							select: 'name',
						})
						.lean()
				} else{
					listMediaPin = [];
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listMediaPin,
						totalRecords: listMediaPin.length
					}
				})
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: GHIM BÀI VIẾT
	 */
	pinMedia({ userID, mediaID, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=========================VALIDATION==========================
				if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if (!checkObjectIDs([mediaID])) {
                    return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });
				}	

				let checkExisted = await MEDIA_COLL.findById(mediaID);
				if (!checkExisted) {
                    return resolve({ error: true, message: "Media don't exited", status: 400 });
				}

				let infoUserAfterUpdated = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.UPDATE_PIN_MEDIA}`, {
					mediaID, userID, isPin: true
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
	 * Dev: NPNguyen 🐸
	 * Func: HỦY GHIM BÀI VIẾT
	 */
	deletePinMedia({ userID, mediaID, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=========================VALIDATION==========================
				if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if (!checkObjectIDs([mediaID])) {
                    return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });
				}

				let checkExisted = await MEDIA_COLL.findById(mediaID);
				if (!checkExisted) {
                    return resolve({ error: true, message: "Media don't exited", status: 400 });
				}

				let infoUserAfterUpdated = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.UPDATE_PIN_MEDIA}`, {
					mediaID, userID, isPin: false
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
	 * Dev: MinhVH 🐸
	 * Func: REACTION BÀI VIẾT
	 */
	reactionMedia({ authorID, mediaID, typeReaction, ctx }) {
		return new Promise(async resolve => {
			try {
				if(!typeReaction || !REACTION_TYPES.includes(typeReaction)) {
                    typeReaction = 1;
				}

				if(!checkObjectIDs([authorID, mediaID])) {
                    return resolve({
						error: true, 
						message: 'Tham số media ID hoặc author ID không hợp lệ', 
						keyError: 'params_messageID_or_authorID_invalid',
						status: 400
					});
				}

				const infoMedia = await MEDIA_COLL
					.findById(mediaID)
					.lean();

				if(!infoMedia) {
					return resolve({
						error: true, 
						message: 'ID media không tồn tại', 
						keyError: 'media_is_not_exists',
						status: 400
					});
				}

				// Kiểm tra đã thả cảm xúc trên bài viết
				const infoReaction = await MEDIA_REACTION_COLL
					.findOne({
						media: mediaID,
						file: { $exists: false },
						comment: { $exists: false },
						userCreate: authorID
					})
					.populate('reaction')
					.lean();

				if(infoReaction && +infoReaction?.reaction?.type === typeReaction){
					const infoAfterDeleteReaction = await MEDIA_REACTION_COLL.findByIdAndDelete(infoReaction._id);

					await MEDIA_COLL.findByIdAndUpdate(mediaID, {
						$inc: {
							amountReaction: -1
						}
					})

					return resolve({
						error: false,
						status: 200,
						data: infoAfterDeleteReaction
					});
				}

				let infoAfterInsertReaction = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION_CORE_INSERT}`, {
					type: typeReaction,
					userID: authorID
				});

				if(infoAfterInsertReaction.error)
					return resolve(infoAfterInsertReaction);

				if(infoReaction) {
					await MEDIA_REACTION_COLL.findByIdAndDelete(infoReaction._id);
				}

				const infoAfterUpdateReaction = await MEDIA_REACTION_COLL.create({
					media: mediaID,
					reaction: infoAfterInsertReaction?.data?._id,
					userCreate: authorID,
				})

				if(!infoAfterUpdateReaction) {
					return resolve({
						error: true, 
						message: 'Đã có lỗi xảy ra', 
						keyError: 'error_occurs',
						status: 422
					});
				}

				await MEDIA_COLL.findByIdAndUpdate(mediaID, {
					$inc: {
						amountReaction: 1
					}
				})

                return resolve({ error: false, data: infoAfterUpdateReaction, status: 200 });
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

	/**
	 * Dev: MinhVH 🐸
	 * Func: DANH SÁCH REACTION BÀI VIẾT
	 */
	getListReaction({ userID, mediaID, lastestID, limit = 20, select = {}, populates = {} }) {
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([userID])) {
                    return resolve({
						error: true, 
						message: 'Tham số or user ID không hợp lệ', 
						keyError: 'params_userID_invalid',
						status: 400
					});
				}

				if(isNaN(limit) || limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates)) {
						return resolve({ 
							error: true, 
							message: 'Tham số populates không hợp lệ', 
							keyError: 'params_populates_invalid',
							status: 400 
						});
					}

					populates = JSON.parse(populates);
				} else{
					populates = {
						path: '',
						select: ''
					}
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select)) {
						return resolve({ 
							error: true, 
							message: 'Tham số select không hợp lệ', 
							keyError: 'params_select_invalid',
							status: 400 
						});
					}

					select = JSON.parse(select);
				}

				let conditionObj = {};
				let conditionFind = {};
                let sortBy = {
                    _id: -1,
					createAt: -1,
                }

				if(lastestID && checkObjectIDs(lastestID)){
                    let infoReaction = await MEDIA_REACTION_COLL.findById(lastestID);
                    if(!infoReaction) {
						return resolve({ 
							error: true, 
							message: "lastestID không tồn tại",
							keyError: 'cannot_get_info_by_lastestID',
							status: 403
						});
					}

                    let nextInfo = `${infoReaction._id}_${infoReaction.createAt}`;
                    let keys 	 = ['_id__-1', 'createAt__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error) {
						return resolve({ 
							error: true, 
							message: "Không thể lấy phạm vi phân trang", 
							keyError: 'cannot_get_range_pagination',
							status: 403
						});
					}

					conditionFind = dataPagingAndSort.data.find;
                }

				if(mediaID && !checkObjectIDs([mediaID])) {
                    conditionObj.media = mediaID;
                    conditionObj.file = { $exists: false };
                    conditionObj.comment = { $exists: false };
				}

				const listReactionMedia = await MEDIA_REACTION_COLL
					.find({ ...conditionObj, ...conditionFind })
					.limit(limit + 1)
					.sort(sortBy)
					.populate(populates)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await MEDIA_REACTION_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listReactionMedia && listReactionMedia.length){
					if(listReactionMedia.length > limit){
						nextCursor = listReactionMedia[limit - 1]._id;
						listReactionMedia.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listReactionMedia,
						limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				console.error(error);
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

}

exports.MODEL = new Model;