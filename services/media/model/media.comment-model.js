"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  = require('mongoose').Types.ObjectId;
const PromisePool 								= require('@supercharge/promise-pool')

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 						= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_REACTION }					= require('../../reaction/helper/reaction.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 				= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs }			            = require('../../../tools/utils/utils');
const timeUtils									= require('../../../tools/utils/time_utils');

/**
 * COLLECTIONS
 */
const MEDIA_COLL					        	= require('../database/media-coll');
const MEDIA_REACTION_COLL				    	= require('../database/media.reaction-coll');
const MEDIA_REACTION_IMAGE_COLL				    = require('../database/media.reaction_image-coll');
const MEDIA_COMMENT_COLL				    	= require('../database/media.comment-coll');
const MEDIA_COMMENT_FILE_COLL				    = require('../database/media.comment_file-coll');

class Model extends BaseModel {

    constructor() {
        super(MEDIA_COMMENT_COLL);
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: THẢ CẢM XÚC TRONG BÀI VIẾT
	 */
	reactionMedia({ authorID, mediaID, typeReaction, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID, mediaID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				// CHECK USER HAVE RAECTION MEDIA
                let checkExistReactionMedia = await MEDIA_REACTION_COLL
					.findOne({
						author: authorID,
						media: mediaID
					})
					.populate({
                        path: 'reaction',
                        select: 'type'
                    })
					.lean();

					console.log({checkExistReactionMedia})

				if(checkExistReactionMedia && typeReaction == checkExistReactionMedia?.reaction?.type){
					let infoAfterDeleteReaction = await MEDIA_REACTION_COLL.findByIdAndDelete(checkExistReactionMedia._id);
                    if (!infoAfterDeleteReaction) {
                        return resolve({ error: true, message: "Can't remove reaction", status: 403 });
                    }

                    return resolve({ error: false, data: infoAfterDeleteReaction, status: 200 });
				}

				let infoAfterInsertReaction = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION_INSERT}`, {
					type: typeReaction
				});

				if(infoAfterInsertReaction.error)
					return resolve({ error: true, message: infoAfterInsertReaction.message, status: 403 });

				if(checkExistReactionMedia) {
					let infoReactionAfterUpdate = await MEDIA_REACTION_COLL.findByIdAndUpdate(checkExistReactionMedia._id, { 
						reaction: infoAfterInsertReaction?.data?._id
					});

					return resolve({ error: false, data: infoReactionAfterUpdate, status: 200 });
				}

				let infoReactionAfterInsert = await MEDIA_REACTION_COLL.create({ 
					author: authorID,
					media: mediaID,
					reaction: infoAfterInsertReaction?.data?._id
				});

                if(!infoReactionAfterInsert)
                    return resolve({ error: true, message: "Can't reaction media", status: 403 });

                return resolve({ error: false, data: infoReactionAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}
	
	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC TRONG BÀI VIẾT
	 */
	getListReactionMedia({ userID, mediaID, lastestID, limit = 20 }) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				if(!checkObjectIDs([mediaID, userID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(isNaN(limit)){
					limit = 20;
				} else{
					limit = +limit;
				}

				let conditionFind = {};
				let conditionObj  = { 
					media: mediaID, 
				};
				let sortBy = {
					modifyAt: -1,
					createdAt: -1,
					updatedAt: -1
				}

				if(lastestID && checkObjectIDs(lastestID)){
					let infoReaction = await MEDIA_REACTION_COLL.findById(lastestID);
					if(!infoReaction)
						return resolve({ error: true, message: "Can't get info last message", status: 403 });

					let nextInfo = `${infoReaction.updatedAt}_${infoReaction._id}`;
					let keys	 = ['updatedAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

				let	listReactionMedia = await MEDIA_REACTION_COLL
					.find({ ...conditionObj, ...conditionFind })
					.populate('author reaction')
					.populate({
						path: 'author',
						select: 'fullname company image',
					})
					.populate({
						path: 'reaction',
						select: '_id type',
					})
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				if(!listReactionMedia)
					return resolve({ error: true, message: "Can't get list reaction media", status: 403 });

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
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

	 /**
	 * Dev: NPNguyen 🐸
	 * Func: THẢ CẢM XÚC TRONG ẢNH CỦA BÀI VIẾT
	 */
	reactionImageMedia({ authorID, imageID, typeReaction, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID, imageID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				// CHECK USER HAVE RAECTION MEDIA
                let checkExistReactionMedia = await MEDIA_REACTION_IMAGE_COLL
					.findOne({
						author: authorID,
						image: imageID
					})
					.populate({
                        path: 'reaction',
                        select: 'type'
                    })
					.lean();

					console.log({checkExistReactionMedia})

				if(checkExistReactionMedia && typeReaction == checkExistReactionMedia?.reaction?.type){
					let infoAfterDeleteReaction = await MEDIA_REACTION_IMAGE_COLL.findByIdAndDelete(checkExistReactionMedia._id);
                    if (!infoAfterDeleteReaction) {
                        return resolve({ error: true, message: "Can't remove reaction", status: 403 });
                    }

                    return resolve({ error: false, data: infoAfterDeleteReaction, status: 200 });
				}

				let infoAfterInsertReaction = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION_INSERT}`, {
					type: typeReaction
				});

				if(infoAfterInsertReaction.error)
					return resolve({ error: true, message: infoAfterInsertReaction.message, status: 403 });

				if(checkExistReactionMedia) {
					let infoReactionAfterUpdate = await MEDIA_REACTION_IMAGE_COLL.findByIdAndUpdate(checkExistReactionMedia._id, { 
						reaction: infoAfterInsertReaction?.data?._id
					});

					return resolve({ error: false, data: infoReactionAfterUpdate, status: 200 });
				}

				let infoReactionAfterInsert = await MEDIA_REACTION_IMAGE_COLL.create({ 
					author: authorID,
					image: imageID,
					reaction: infoAfterInsertReaction?.data?._id
				});

                if(!infoReactionAfterInsert)
                    return resolve({ error: true, message: "Can't reaction media", status: 403 });

                return resolve({ error: false, data: infoReactionAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC TRONG ẢNH CỦA BÀI VIẾT
	 */
	getListReactionImageMedia({ userID, imageID, lastestID, limit = 20 }) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				if(!checkObjectIDs([imageID, userID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(isNaN(limit)){
					limit = 20;
				} else{
					limit = +limit;
				}

				let conditionFind = {};
				let conditionObj  = { 
					image: imageID, 
				};
				let sortBy = {
					modifyAt: -1,
					createdAt: -1,
					updatedAt: -1
				}

				if(lastestID && checkObjectIDs(lastestID)){
					let infoReaction = await MEDIA_REACTION_IMAGE_COLL.findById(lastestID);
					if(!infoReaction)
						return resolve({ error: true, message: "Can't get info last message", status: 403 });

					let nextInfo = `${infoReaction.updatedAt}_${infoReaction._id}`;
					let keys	 = ['updatedAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

				let	listReactionMedia = await MEDIA_REACTION_IMAGE_COLL
					.find({ ...conditionObj, ...conditionFind })
					.populate('author reaction')
					.populate({
						path: 'author',
						select: 'fullname company image',
					})
					.populate({
						path: 'reaction',
						select: '_id type',
					})
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				if(!listReactionMedia)
					return resolve({ error: true, message: "Can't get list reaction media", status: 403 });

				// GET TOTAL RECORD
				let totalRecord = await MEDIA_REACTION_IMAGE_COLL.countDocuments(conditionObj);
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
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

	 /**
	 * Dev: NPNguyen 🐸
	 * Func: THẢ CẢM XÚC VÀO COMMENT TRONG BÀI VIẾT
	 */
	reactionComment({ authorID, commentID, typeReaction, ctx }){
		return new Promise(async resolve => {
			try {

				if(!checkObjectIDs([authorID, commentID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });
		
				// CHECK USER HAVE RAECTION COMMENT MEDIA
				let checkExistReactionCommentMedia = await MEDIA_REACTION_COLL
					.findOne({
						author: authorID,
						comment: commentID
					})
					.populate({
                        path: 'reaction',
                        select: 'type'
                    })
					.lean();

				if(checkExistReactionCommentMedia && typeReaction == checkExistReactionCommentMedia?.reaction?.type){
					let infoAfterDeleteReaction = await MEDIA_REACTION_COLL.findByIdAndDelete(checkExistReactionCommentMedia._id);
                    if (!infoAfterDeleteReaction) {
                        return resolve({ error: true, message: "Can't remove reaction", status: 403 });
                    }

                    return resolve({ error: false, data: infoAfterDeleteReaction, status: 200 });
				}

				let infoAfterInsertReaction = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION_INSERT}`, {
					type: typeReaction
				});

				if(infoAfterInsertReaction.error)
					return resolve({ error: true, message: infoAfterInsertReaction.message, status: 403 });

				if(checkExistReactionCommentMedia) {
					let infoReactionAfterUpdate = await MEDIA_REACTION_COLL.findByIdAndUpdate(checkExistReactionCommentMedia._id, { 
						reaction: infoAfterInsertReaction?.data?._id
					});

					return resolve({ error: false, data: infoReactionAfterUpdate, status: 200 });
				}

				let infoReactionAfterInsert = await MEDIA_REACTION_COLL.create({ 
					author: authorID,
					comment: commentID,
					reaction: infoAfterInsertReaction?.data?._id
				});

                if(!infoReactionAfterInsert)
                    return resolve({ error: true, message: "Can't reaction comment media", status: 403 });

                return resolve({ error: false, data: infoReactionAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH CÁC USER ĐÃ THẢ CẢM XÚC VÀO COMMENT
	 */
	getListReactionComment({ userID, commentID, lastestID, limit = 20 }) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				if(!checkObjectIDs([commentID, userID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(isNaN(limit)){
					limit = 20;
				} else{
					limit = +limit;
				}

				let conditionFind = {};
				let conditionObj  = { 
					comment: commentID, 
				};
				let sortBy = {
					modifyAt: -1,
					createdAt: -1,
					updatedAt: -1
				}

				if(lastestID && checkObjectIDs(lastestID)){
					let infoReaction = await MEDIA_REACTION_COLL.findById(lastestID);
					if(!infoReaction)
						return resolve({ error: true, message: "Can't get info last reaction comment", status: 403 });

					let nextInfo = `${infoReaction.updatedAt}_${infoReaction._id}`;
					let keys	 = ['updatedAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

				let	listReactionComment = await MEDIA_REACTION_COLL
					.find({ ...conditionObj, ...conditionFind })
					.populate({
                        path: 'author',
                        select: 'fullname image'
                    })
					.populate({
                        path: 'reaction',
                        select: 'type'
                    })
					.limit(limit + 1)
					.sort(sortBy)
					.lean();
				console.log('listReactionComment: ', listReactionComment);
				if(!listReactionComment)
					return resolve({ error: true, message: "Can't get list reaction comment", status: 403 });

				// GET TOTAL RECORD
				let totalRecord = await MEDIA_REACTION_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listReactionComment && listReactionComment.length){
					if(listReactionComment.length > limit){
						nextCursor = listReactionComment[limit - 1]._id;
						listReactionComment.length = limit;
					}
				}

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						listRecords: listReactionComment,
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: COMMENT TRONG BÀI VIẾT
	 */
	commentMedia({ authorID, mediaID, parentID, content, images, files, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID, mediaID]))
                    return resolve({ error: true, message: 'Request params authorID or mediaID invalid', status: 400 });

				let infoCommentAfterInsert = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_INSERT}`, {
					content
				});

				if(!infoCommentAfterInsert || infoCommentAfterInsert.error)
					return resolve({ error: true, message: "Can't add comment", status: 403 });

				const dataInsertComment = {
					author: authorID,
					media: mediaID,
					comment: infoCommentAfterInsert?.data?._id,
				}

				if(parentID){
					if(!checkObjectIDs(parentID))
						return resolve({ error: true, message: "Request params parentID invalid", status: 400 });

					dataInsertComment.parent = parentID;
				}

				if(files && files.length){
					if(!checkObjectIDs(files))
						return resolve({ error: true, message: "Request params files invalid", status: 400 });

					dataInsertComment.files = files;
				}

				if(images && images.length){
					if(!checkObjectIDs(images))
						return resolve({ error: true, message: "Request params images invalid", status: 400 });

					dataInsertComment.images = images;
				}

				let infoCommentMediaAfterInsert = await this.insertData(dataInsertComment);

                if(!infoCommentMediaAfterInsert)
                    return resolve({ error: true, message: "Can't comment media", status: 422 });

				if(parentID){
					await MEDIA_COMMENT_COLL.findByIdAndUpdate(parentID, {
						lastestReplyID: infoCommentMediaAfterInsert._id
					});
				}

                return resolve({ error: false, data: infoCommentMediaAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH COMMENT TRONG BÀI VIẾT
	 */
	getListCommentMedia({ mediaID, lastestID, limit = 20 }) {
		return new Promise(async (resolve) => {
			try {
				if(!checkObjectIDs([mediaID]))
					return resolve({ error: true, message: 'Request params mediaID invalid', status: 400 });

				if(isNaN(limit)){
					limit = 20;
				} else{
					limit = +limit;
				}

				let nextCursor	= null;
				let conditionFind = {};
				let conditionObj = {
					media: mediaID,
					parent: { $exists: false }
				};
				let sortBy = {
					createAt: -1,
					_id: -1,
				}

				if(lastestID && checkObjectIDs(lastestID)){
					let infoMediaComment = await MEDIA_COMMENT_COLL.findById(lastestID);
					if(!infoMediaComment)
						return resolve({ error: true, message: "Can't get info last media comment", status: 403 });

					let nextInfo = `${infoMediaComment.createAt}_${infoMediaComment._id}`;
					let keys	 = ['createAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

				let listComment = await MEDIA_COMMENT_COLL.find({ ...conditionObj, ...conditionFind })
					.populate({
						path: 'author',
						select: '_id fullname company image',
					})
					.populate({
						path: 'comment',
						select: 'content',
					})
					.populate({
						path: 'files',
						select: '_id name url size type',
					})
					.populate({
						path: 'images',
						select: '_id name url size type',
					})
					.populate('lastestReplyID')
					.sort(sortBy)
					.limit(limit + 1)
					.lean();

				if(!listComment || !listComment.length)
					return resolve({ error: true, message: "Can't get list comment", status: 403 });

				let idxComment = 0;
				for (let comment of []) {
					let idxCommentChild = 0;
					let totalCommentChild 		= await MEDIA_COMMENT_COLL.count({ parent: comment._id })
					let totalReactionComment 	= await MEDIA_REACTION_COLL.count({ comment: comment.comment._id })
					let listCommnetChild 		= await MEDIA_COMMENT_COLL.find({ parent: comment._id })
						.select('_id')
						.populate({
							path: 'author',
							select: 'fullname company image',
						})
						.populate({
							path: 'comment',
							select: 'content'
						})
						.sort(sortBy)
						.limit(2)
						.lean();

					for (let commentChid of listCommnetChild) {
						let totalReactionCommentChild 	= await MEDIA_REACTION_COLL.count({ comment: commentChid.comment._id })
						let infoCommentChildFile 		= await MEDIA_COMMENT_FILE_COLL.find({ comment: commentChid.comment._id })
							.select('_id')
							.populate({
								path: 'file',
								select: 'name url',
							})

						listCommnetChild[idxCommentChild].comment = {
							...listCommnetChild[idxCommentChild].comment,
							totalReactionCommentChild,
							files: infoCommentChildFile
						}
						idxCommentChild ++;
					}

					let infoCommentFile = await MEDIA_COMMENT_FILE_COLL.find({ comment: comment.comment._id })
						.select('_id')
						.populate({
							path: 'file',
							select: 'name url',
						})

					listComment[idxComment].comment = {
						...listComment[idxComment].comment,
						totalCommentChild,
						totalReactionComment,
						listCommnetChild,
						files: infoCommentFile
					}
					idxComment++;
				}

				if(listComment && listComment.length){
					if(listComment.length > limit){
						nextCursor = listComment[limit - 1]._id;
						listComment.length = limit;
					}
				}

				let totalRecord = await MEDIA_COMMENT_COLL.countDocuments(conditionObj);

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						listRecords: listComment,
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

	 /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY CHI TIẾT COMMENT TRONG BÀI VIẾT
	 */
	getDetailCommentMedia({commentID}) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
				}

				if(!checkObjectIDs([commentID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });
				
				let infoComent = await MEDIA_COMMENT_COLL.findOne({ comment: commentID })
					.select('_id')
					.populate({
						path: 'author',
						select: 'fullname company image',
					})
					.populate({
						path: 'comment',
						select: 'content',
					})
					.lean();

				
				if(infoComent){
					let idxCommentChild = 0;
					let totalCommentChild 	= await MEDIA_COMMENT_COLL.count({ parent: infoComent._id })
					let totalReactionComment 	= await MEDIA_REACTION_COLL.count({ comment: infoComent.comment._id })
					let listCommnetChild 	= await MEDIA_COMMENT_COLL.find({ parent: infoComent._id })
						.select('_id')
						.populate({
							path: 'author',
							select: 'fullname company image',
						})
						.populate({
							path: 'comment',
							select: 'content'
						})
						.sort(sortBy)
						.lean();

					for (let commentChid of listCommnetChild) {
						let totalReactionCommentChild 	= await MEDIA_REACTION_COLL.count({ comment: commentChid.comment._id })
						let infoCommentChildFile 	= await MEDIA_COMMENT_FILE_COLL.find({ comment: commentChid.comment._id })
							.select('_id')
							.populate({
								path: 'file',
								select: 'name url',
							})

						listCommnetChild[idxCommentChild].comment = {
							...listCommnetChild[idxCommentChild].comment,
							totalReactionCommentChild,
							files: infoCommentChildFile
						}
						idxCommentChild ++;
					}

					let infoCommentFile 	= await MEDIA_COMMENT_FILE_COLL.find({ comment: infoComent.comment._id })
						.select('_id')
						.populate({
							path: 'file',
							select: 'name url',
						})

					infoComent.comment = {
						...infoComent.comment,
						totalCommentChild,
						totalReactionComment,
						listCommnetChild,
						files: infoCommentFile
					}

				}
				
				if(!infoComent)
					return resolve({ error: true, message: "Can't get info comment", status: 403 });

				return resolve({ 
					error: false, 
					status: 200,
					data: {
						infoComent,
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: CHỈNH SỬA COMMENT TRONG BÀI VIẾT
	 */
	updateCommentMedia({ authorID, commentID, content, images, files, ctx }){
		return new Promise(async resolve => {
			try {
				const dataUpdateComment = {};
				
				if(!checkObjectIDs([authorID, commentID]))
                    return resolve({ error: true, message: 'Request params authorID or commentID invalid', status: 400 });

				let checkCommentOfUser = await MEDIA_COMMENT_COLL.findOne({ 
					author: authorID,
					comment: commentID,
				}).lean();

				if(!checkCommentOfUser)
					return resolve({ error: true, message: "Can't find comment of user", status: 403 });

				let infoCommentAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_UPDATE}`, {
					commentID, content
				});

				if(!infoCommentAfterUpdate && infoCommentAfterUpdate.error)
					return resolve({ error: true, message: "Can't update comment", status: 403 });

				if(files && files.length){
					if(!checkObjectIDs(files))
						return resolve({ error: true, message: "Request params files invalid", status: 400 });

					dataUpdateComment.files = files;
				}

				if(images && images.length){
					if(!checkObjectIDs(images))
						return resolve({ error: true, message: "Request params images invalid", status: 400 });

					dataUpdateComment.images = images;
				}

				let infoCommentMediaAfterInsert = await MEDIA_COMMENT_COLL.findByIdAndUpdate(checkCommentOfUser,_id, dataUpdateComment, {
					new: true
				});

                return resolve({ error: false, data: infoCommentMediaAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA COMMENT TRONG BÀI VIẾT
	 */
	deleteCommentMedia({ authorID, commentID }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID, commentID]))
                    return resolve({ error: true, message: 'Request params authorID or commentID invalid', status: 400 });

				const deleteCommentOfUser = await MEDIA_COMMENT_COLL.deleteMany({ 
					author: authorID,
					comment: commentID,
				});

				await MEDIA_COMMENT_COLL.deleteMany({ 
					parent: commentID,
				});
		
				if(!deleteCommentOfUser)
					return resolve({ error: true, message: "Can't delete comment of user", status: 422 });

                return resolve({ error: false, data: deleteCommentOfUser, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: TRẢ LỜI COMMENT TRONG BÀI VIẾT
	 */
	replyCommentMedia({ authorID, mediaID, commentID, content, files, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID, commentID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				// Insert comment (content)
				let infoCommentAfterInsert = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_INSERT}`, {
					content
				});

				if(!infoCommentAfterInsert && infoCommentAfterInsert.error)
					return resolve({ error: true, message: "Can't add comment", status: 403 });

				let infoCommentParent = await MEDIA_COMMENT_COLL.findById(commentID);

				let infoCommentMediaAfterInsert = await MEDIA_COMMENT_COLL.create({ 
					author: authorID,
					media: mediaID,
					comment: infoCommentAfterInsert?.data?._id,
					parent: infoCommentParent?.parent ? infoCommentParent?.parent : commentID,
					createAt: timeUtils.getCurrentTime(),
					modifyAt: timeUtils.getCurrentTime()
				});

                if(!infoCommentMediaAfterInsert)
                    return resolve({ error: true, message: "Can't comment media", status: 403 });

                if(files && files.length){
                    let listFilesComment = files.map(file => ({
                        app: CF_DOMAIN_SERVICES.MEDIA,
                        name: file.name,
                        url: file.url,
                        size: file.size,
                        userID: authorID,
                    }))

                    await PromisePool
                        .for(listFilesComment)
                        .withConcurrency(2)
                        .process(async file => {
                            // Insert file core collection
                            let infoFile = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, file);

                            // Update status file core collection
                            await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.UPDATE_STATUS_FILE}`, {
                                fileID: infoFile.data && infoFile.data._id.toString(),
                                status: "1",
                                userID: authorID,
                            });

							let infoCommentFileMediaAfterInsert = await MEDIA_COMMENT_FILE_COLL.create({ 
								comment: infoCommentAfterInsert?.data?._id,
								file: infoFile.data && infoFile.data._id.toString(),
								createAt: timeUtils.getCurrentTime(),
								modifyAt: timeUtils.getCurrentTime()
							});

							if(!infoCommentFileMediaAfterInsert)
								return resolve({ error: true, message: "Can't upload comment file in media", status: 403 });

                            // await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_REACTION.COMMENT_FILE_CORE_INSERT}`, {
                            //     fileCore: infoFile.data && infoFile.data._id.toString(),
                            //     comment: infoCommentAfterInsert?.data?._id,
                            // });
                        })
                }

                return resolve({ error: false, data: infoCommentMediaAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

}

exports.MODEL = new Model;