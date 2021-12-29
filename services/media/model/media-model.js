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
const MEDIA_COMMENT_COLL					    = require('../database/media.comment-coll');
const MEDIA_REACTION_COLL					    = require('../database/media.reaction-coll');
const MEDIA_SAVE_COLL					    	= require('../database/media.save-coll');
const MEDIA_PIN_COLL					    	= require('../database/media.pin-coll');
const MEDIA_COMMENT_IMAGE_COLL					= require('../database/media.comment_image-coll');


class Model extends BaseModel {
    constructor() {
        super(MEDIA_COLL);
    }

	 /**
	 * Dev: NPNguyen 🐸
	 * Func: THÊM BÀI VIẾT MỚI
	 */
	insert({ authorID, title, content, type, location, files, tagFriends, images, background, companyID, ctx }) {
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
						conditionReceiver = { department };
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
		mediaID, authorID, title, content, type, location, files, filesDelete, tagFriends, images, imageDelete, background, companyID, group
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

				if (filesDelete && filesDelete.length) {
					if(!checkObjectIDs(filesDelete))
                    	return resolve({ error: true, message: 'Request params filesDelete invalid', status: 400 });

					condition = {
						...condition,
						$pullAll: {
							files: filesDelete
						},
					}
				}

				if (imageDelete && imageDelete.length) {
					if(!checkObjectIDs(imageDelete))
                    	return resolve({ error: true, message: 'Request params imageDelete invalid', status: 400 });

					condition.$pullAll = {
						...condition.$pullAll,
						images: imageDelete
					}
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
    getListMedia({ userID, lastestID, companyID, type, limit = 20, ctx }){
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

				let listMediaAfterSet = [];
				let nextCursor	= null;
				if (listMedia && listMedia.length) {
					if(listMedia.length > limit){
						nextCursor = listMedia[limit - 1]._id;
						listMedia.length = limit;
					}
				}

				if (listMedia && listMedia.length) {
					for (let media of listMedia) {
						let countUserWatched = await MEDIA_SEEN_COLL.countDocuments({
							media: { $in: [media._id] }
						});

						let countComments = await MEDIA_COMMENT_COLL.countDocuments({
							media: { $in: [media._id] }
						});

						let countReactions = await MEDIA_REACTION_COLL.countDocuments({
							media: { $in: [media._id] }
						});

						listMediaAfterSet[listMediaAfterSet.length] = {
							...media,
							totalComments: countComments,
							totalWatched: countUserWatched,
							totalReactions: countReactions,
						}
						
						// let listComment = await MEDIA_COMMENT_COLL.find({ media: { $in: [media._id] }, parent: { $exists: false } })
						// 	.select('_id')
						// 	.populate({
						// 		path: 'author',
						// 		select: 'fullname company image',
						// 	})
						// 	.populate({
						// 		path: 'comment',
						// 		select: 'content',
						// 	})
						// 	.sort(sortBy)
						// 	.limit(2)
						// 	.lean();

						// let idxComment = 0;
						// for (let comment of listComment) {
						// 	let idxCommentChild = 0;
						// 	let totalCommentChild 		= await MEDIA_COMMENT_COLL.count({ parent: comment._id })
						// 	let totalReactionComment 	= await MEDIA_REACTION_COLL.count({ comment: comment.comment._id })
						// 	let listCommnetChild 		= await MEDIA_COMMENT_COLL.find({ parent: comment._id })
						// 		.select('_id')
						// 		.populate({
						// 			path: 'author',
						// 			select: 'fullname company image',
						// 		})
						// 		.populate({
						// 			path: 'comment',
						// 			select: 'content'
						// 		})
						// 		.sort(sortBy)
						// 		.limit(2)
						// 		.lean();

						// 	for (let commentChid of listCommnetChild) {
						// 		let infoCommentChildFile 	= await MEDIA_COMMENT_FILE_COLL.find({ comment: commentChid.comment._id })
						// 			.select('_id')
						// 			.populate({
						// 				path: 'file',
						// 				select: 'name url',
						// 			})
						// 		let totalReactionCommentChild 	= await MEDIA_REACTION_COLL.count({ comment: commentChid.comment._id })

						// 		listCommnetChild[idxCommentChild].comment = {
						// 			...listCommnetChild[idxCommentChild].comment,
						// 			totalReactionCommentChild,
						// 			files: infoCommentChildFile
						// 		}
						// 		idxCommentChild ++;
						// 	}

						// 	let infoCommentFile = await MEDIA_COMMENT_FILE_COLL.find({ comment: comment.comment._id })
						// 		.select('_id')
						// 		.populate({
						// 			path: 'file',
						// 			select: 'name url',
						// 		})

						// 	listComment[idxComment].comment = {
						// 		...listComment[idxComment].comment,
						// 		totalCommentChild,
						// 		totalReactionComment,
						// 		files: infoCommentFile,
						// 		listCommnetChild,
						// 	}
						// 	idxComment++;
						// }
						// for(const comment of listComment) {

						// 	let listComment2 = await MEDIA_REACTION_COLL.find({ comment: { $in: [comment._id] } })
						// 		.populate({
						// 			path: 'reaction',
						// 			select: 'type',
						// 		})
						// 	console.log({listComment2})
						// }

						// TODO: Count total comment of User

						// listMediaAfterSet = [
						// 	...listMediaAfterSet,
						// 	{
						// 		...media,
						// 		totalUserWatched: countUserWatched,
						// 		totalComments: countComments,
						// 		totalReactions: countReactions,
						// 		listComment
						// 	}
						// ]
					}
				}

				// GET TOTAL RECORD
				let totalRecord = await MEDIA_COLL.countDocuments(conditionObj);
				let totalPages = Math.ceil(totalRecord / limit);

				return resolve({ 
					error: false,
					status: 200,
					data: { 
						listRecords: listMediaAfterSet, 
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
	getListPinMedia({ userID, lastestID, limit, ctx }) {
        return new Promise(async (resolve) => {
            try {
				//=======================VARIABLE/CONSTANTS=====================
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

				let	listMediaHavedPin = await MEDIA_PIN_COLL.find({
					userPin: { $in: userID },
				})
				
				if(!listMediaHavedPin)
					return resolve({ error: true, message: "Can't get list media", status: 403 });

				let listAfterFind = await this.getListWithCondition({
					conditionObj: {
						_id: [...listMediaHavedPin.map(item => item.media)]
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
	 * Func: GHIM BÀI VIẾT
	 */
	pinMedia({ author, mediaID, ctx }) {
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
					userPin: author,
					media: mediaID,
				}

				// CHECK USER HAVE PIN MEDIA
                let checkExistSaveMedia = await MEDIA_PIN_COLL.findOne(condition).lean();

				if(checkExistSaveMedia) {
					return resolve({ error: true, message: 'You have already pin this post', status: 403 });
				}

				let infoMediaAfterInserted = await MEDIA_PIN_COLL.create({ 
					...condition
				});

                if(!infoMediaAfterInserted)
                    return resolve({ error: true, message: "Can't pin media", status: 403 });

                return resolve({ error: false, data: infoMediaAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: HỦY GHIM BÀI VIẾT
	 */
	deletePinMedia({ author, mediaID, ctx }) {
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
					userPin: author,
					media: mediaID,
				}

				let infoMediaAfterDelete = await MEDIA_PIN_COLL.findOneAndDelete({ 
					...condition
				});

                if(!infoMediaAfterDelete)
                    return resolve({ error: true, message: "Can't delete pin media", status: 403 });

                return resolve({ error: false, data: infoMediaAfterDelete, status: 200 });
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