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
const { MEDIA_TYPES } 							= require('../helper/media.keys-constant');

/**
 * TOOLS
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 				= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, isEmptyObject }			= require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const MEDIA_COLL					        	= require('../database/media-coll');
const MEDIA_FILE_COLL					    	= require('../database/media.file-coll');
const MEDIA_SEEN_COLL					    	= require('../database/media.seen-coll');
const MEDIA_SAVE_COLL					    	= require('../database/media.save-coll');
const MEDIA_COMMENT_IMAGE_COLL					= require('../database/media.comment_image-coll');


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
				let condition = {};
				let receiversNoti = [];

				//=========================VALIDATION==========================
				if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

				if (!MEDIA_TYPES.includes(type)) {
                    return resolve({ error: true, message: 'Request params type invalid', status: 400 });
				}

				condition = {
					author: authorID,
					title,
					content,
				}

				switch (type) {
					case 'company':
						condition.type = 1;
						break;
					case 'just-me':
						condition.type = 2;
						break;
					case 'departments':
						condition.type = 3;
						break;
					case 'community':
						condition.type = 4;
						break;
					case 'system':
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

				if (departmentID) {
					if(!checkObjectIDs(departmentID))
                    	return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

					condition.department = departmentID;
				}

				let infoMediaAfterInserted = await this.insertData(condition);

                if(!infoMediaAfterInserted)
                    return resolve({ error: true, message: "Can't create media", status: 422 });

				// INSERT FILE GỌI QUA FILE CORE SERVICE
				let conditionObjUpdate = {};
				let mediaID = infoMediaAfterInserted._id;

				if (background) {
					if(!checkObjectIDs(background))
						return resolve({ error: true, message: 'Request background media failed', status: 403 });

					conditionObjUpdate.background = background;
				}

				if (files && files.length) {
					if(!checkObjectIDs(files))
						return resolve({ error: true, message: 'Request files media failed', status: 403 });

					conditionObjUpdate.files = files;
				}

				if (images && images.length) {
					if(!checkObjectIDs(images))
						return resolve({ error: true, message: 'Request images media failed', status: 403 });

					conditionObjUpdate.images = images;
				}

				if (!isEmptyObject(conditionObjUpdate)) {
					infoMediaAfterInserted = await MEDIA_COLL.findByIdAndUpdate(mediaID, conditionObjUpdate, { new: true });
				}

				let conditionReceiver = {};

				switch (condition.type) {
					case 1:
						conditionReceiver = { company: companyID };
						break;
					case 3:
						conditionReceiver = { department: departmentID };
						break;
					default:
						break;
				};

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
					case 'just-me':
						condition.type = 2;
						break;
					case 'departments':
						condition.type = 3;
						break;
					case 'community':
						condition.type = 4;
						break;
					case 'system':
						condition.type = 4;
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
    getListMedia({ userID, lastestID, companyID, departmentID, type, limit = 20, ctx }){
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

				if(companyID && checkObjectIDs(companyID)){
					conditionObj.company = companyID;
				}

				if(departmentID && checkObjectIDs(departmentID)){
					conditionObj.department = departmentID;
				}

				switch (type) {
					case 'company':
						conditionObj.type = 1;
						break;
					case 'just-me':
						conditionObj.type = 2;
						break;
					case 'departments':
						conditionObj.type = 3;
						break;
					case 'community':
						conditionObj.type = 4;
						break;
					case 'system':
						conditionObj.type = 5;
						break;
					case 'internal-company':
						conditionObj.type = { $in: [1,2,3] };
						break;
					default:
						break;
				}
				console.log({ conditionObj })

                let listAfterFind = await this.getListWithCondition({
					conditionObj,
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
	 * Func: XÓA BÀI VIẾT	
	 */
	remove({ mediaID }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(mediaID))
					return resolve({ error: true, message: 'Request param mediaID invalid', status: 400 });

				// let infoMediaAfterDelete = await MEDIA_COLL.findByIdAndUpdate(mediaID, { status: 2 }, { new: true });
				let infoMediaAfterDelete = await MEDIA_COLL.findByIdAndDelete(mediaID);

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
	 * Func: XÓA BÀI VIẾT	
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
	 * Func: LẤY DANH SÁCH CÁC USER ĐÃ XEM BÀI VIẾT
	 */
	getListWatchedMedia({ mediaID, lastestID, limit }) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
				let listUserWatched = [];
				let sortBy = {
					_id: -1,
				};
				
				//=========================VALIDATION==========================
				if(!checkObjectIDs([mediaID]))
                    return resolve({ error: true, message: 'Request params media invalid', status: 400 });
				
				if(!limit || isNaN(limit))
					limit = 10;

				limit = +limit;

				let conditionFind = {};
                if(lastestID && checkObjectIDs(lastestID)) {
					let infoSeenMedia = await MEDIA_SEEN_COLL.findById(lastestID)
                    if(!infoSeenMedia)
                        return resolve({ error: true, message: "Can't get info last user", status: 403 });

					// let nextInfo = `${infoSeenMedia._id}`;
					// let keys	 = ['_id__-1'];
					let nextInfo = `${infoSeenMedia.createdAt}_${infoSeenMedia._id}`;
					let keys	 = ['createdAt__-1', '_id__-1'];

                    // let nextInfo = `${infoSeenMedia._id}`;
					// let keys	 = ['_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
				
					conditionFind = dataPagingAndSort.data.find;
                }

				let infoSeenMedia = await MEDIA_SEEN_COLL.find({
					media: { $in: [mediaID] }
				}).lean();

				if(!infoSeenMedia)
					return resolve({ error: true, message: "Can't get list user seen media", status: 403 });
			
				let	listWatched = await MEDIA_SEEN_COLL
					.find({
						media: mediaID, 
						...conditionFind
					})
					.select('userSeen')
					.populate({
						path: 'userSeen',
						select: 'bizname fullname image',
					})
					.limit(limit)
					.sort(sortBy)
					.lean();

                if(!listWatched)
                    return resolve({ error: true, message: "Can't get list user seen media", status: 403 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						listUserWatched: listWatched,
						limit,
						totalUserWatched: infoSeenMedia.length
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: ĐÁNH DẤU NGƯỜI XEM BÀI VIẾT	
	 */
	watchedMedia({ userID, mediaID }) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
				let condition = {};

				//=========================VALIDATION==========================
				if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if (!checkObjectIDs([mediaID])) {
                    return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });
				}	

				condition = {
					userSeen: userID,
					media: mediaID,

				}

				// CHECK USER HAVE SEEN MEDIA
                let checkExistSaveMedia = await MEDIA_SEEN_COLL.findOne(condition).lean();

				if(checkExistSaveMedia) {
					return resolve({ error: true, message: 'You have already seen this post', status: 403 });
				}

				let infoMediaAfterInserted = await MEDIA_SEEN_COLL.create({ 
					...condition
				});

                if(!infoMediaAfterInserted)
                    return resolve({ error: true, message: "Can't watched media", status: 403 });

                return resolve({ error: false, data: infoMediaAfterInserted, status: 200 });
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
	 * Dev: NPNguyen 🐸
	 * Func: COMMENT ẢNH TRONG BÀI VIẾT
	 */
	getInfoImageMedia({ imageID, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([imageID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				let infoImage = await MEDIA_FILE_COLL.findOne({_id: imageID})
					.select("_id")
					.populate({
						path: 'file',
						select: 'url'
					})
					.lean();



				let totalCommentImages  = await MEDIA_COMMENT_IMAGE_COLL.count({ image: imageID })

				infoImage = {
					...infoImage,
					totalCommentImages,
				}
				
				if(!infoImage)
                    return resolve({ error: true, message: "Can't get info image", status: 403 });

				return resolve({ error: false, data: infoImage, status: 200 });
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

}

exports.MODEL = new Model;