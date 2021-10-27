"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  = require('mongoose').Types.ObjectId;
const moment									= require('moment');
const PromisePool 								= require('@supercharge/promise-pool')
/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 						= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_REACTION } 					= require('../../reaction/helper/reaction.actions-constant');
const { CF_ACTIONS_AUTH } 						= require('../../auth/helper/auth.actions-constant');
const timeUtils									= require('../../../tools/utils/time_utils');
/**
 * TOOLS
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION } 				= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, isTrue, isEmptyObject }	= require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const MEDIA_COMMENT_FILE_COLL				     = require('../database/media.comment_file-coll');
const MEDIA_REACTION_COLL				    	 = require('../database/media.reaction-coll');
const MEDIA_COMMENT_IMAGE_COLL					 = require('../database/media.comment_image-coll');
const MEDIA_REACTION_IMAGE					     = require('../database/media.reaction_image-coll');

/**
 * MODELS
 */


class Model extends BaseModel {

    constructor() {
        super(MEDIA_REACTION_IMAGE);
    }

	/**
	 * Dev: NPNguyen 🐸
	 * Func: COMMENT ẢNH TRONG BÀI VIẾT
	 */
	commentImageMedia({ authorID, imageID, content, files, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID, imageID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				// Insert comment (content)
				let infoCommentAfterInsert = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_INSERT}`, {
					content
				});

				if(!infoCommentAfterInsert && infoCommentAfterInsert.error)
					return resolve({ error: true, message: "Can't add image comment", status: 403 });

				let infoCommentMediaAfterInsert = await MEDIA_COMMENT_IMAGE_COLL.create({ 
					author: authorID,
					image: imageID,
					comment: infoCommentAfterInsert?.data?._id,
					createAt: timeUtils.getCurrentTime(),
					modifyAt: timeUtils.getCurrentTime()
				});

                if(!infoCommentMediaAfterInsert)
                    return resolve({ error: true, message: "Can't comment image media", status: 403 });

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

							// let infoFileInsert = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_REACTION.COMMENT_FILE_CORE_INSERT}`, {
                            //     fileCore: infoFile.data && infoFile.data._id.toString(),
                            //     comment: infoCommentAfterInsert._id,
                            // });
                        })
                }

                return resolve({ error: false, data: infoCommentMediaAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

    /**
	 * Dev: NPNguyen 🐸
	 * Func: LẤY DANH SÁCH COMMENT ẢNH TRONG BÀI VIẾT
	 */
	getListCommentImageMedia({imageID, lastestID, limit = 20 }) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				if(!checkObjectIDs([imageID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

				if(isNaN(limit)){
					limit = 20;
				} else{
					limit = +limit;
				}
				let nextCursor	= null;
				let conditionFind = {};
				let sortBy = {
					modifyAt: -1,
					createdAt: -1,
					updatedAt: -1
				}

				if(lastestID && checkObjectIDs(lastestID)){
					let infoReaction = await MEDIA_COMMENT_IMAGE_COLL.findById(lastestID);
					if(!infoReaction)
						return resolve({ error: true, message: "Can't get info last reaction comment", status: 403 });

					let nextInfo = `${infoReaction.modifyAt}_${infoReaction._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}
				
				let listComment = await MEDIA_COMMENT_IMAGE_COLL.find({ image: { $in: [imageID] }, parent: { $exists: false }, ...conditionFind })
					.select('_id modifyAt createdAt updatedAt')
					.populate({
						path: 'author',
						select: 'fullname company image',
					})
					.populate({
						path: 'comment',
						select: 'content',
					})
					.sort(sortBy)
					.limit(limit + 1)
					.lean();

				
				if(listComment && listComment.length){
					
					let idxComment = 0;
					for (let comment of listComment) {
						let idxCommentChild = 0;
						let totalCommentChild 		= await MEDIA_COMMENT_IMAGE_COLL.count({ parent: comment._id })
						let totalReactionComment 	= await MEDIA_REACTION_COLL.count({ comment: comment.comment._id })
						let listCommnetChild 		= await MEDIA_COMMENT_IMAGE_COLL.find({ parent: comment._id })
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
						
						let infoCommentFile 	= await MEDIA_COMMENT_FILE_COLL.find({ comment: comment.comment._id })
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
						idxComment ++;
					}

				}
				
				if(!listComment)
					return resolve({ error: true, message: "Can't get list comment", status: 403 });

				if(listComment && listComment.length){
					if(listComment.length > limit){
						nextCursor = listComment[limit - 1]._id;
						listComment.length = limit;
					}
				}

				let totalRecord = await MEDIA_COMMENT_IMAGE_COLL.countDocuments({ image: { $in: [imageID] }, parent: { $exists: false } });

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
	 getDetailCommentImageMedia({commentID}) {
		return new Promise(async (resolve) => {
			try {
				// Check params
				let sortBy = {
					modifyAt: -1,
					createdAt: -1,
					updatedAt: -1
				}

				if(!checkObjectIDs([commentID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });
				
				let infoComent = await MEDIA_COMMENT_IMAGE_COLL.findOne({ comment: commentID })
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
					let totalCommentChild 	= await MEDIA_COMMENT_IMAGE_COLL.count({ parent: infoComent._id })
					let totalReactionComment 	= await MEDIA_REACTION_COLL.count({ comment: infoComent.comment._id })
					let listCommnetChild 	= await MEDIA_COMMENT_IMAGE_COLL.find({ parent: infoComent._id })
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
	 * Func: CHỈNH SỬA COMMENT ẢNH TRONG BÀI VIẾT
	 */
	updateCommentImageMedia({ authorID, commentID, content, files, ctx }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([authorID, commentID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				let checkCommentOfUser = await MEDIA_COMMENT_IMAGE_COLL.find({ 
					author: authorID,
					comment: commentID,
				});
	
				if(!checkCommentOfUser || !checkCommentOfUser.length)
					return resolve({ error: true, message: "Can't find comment of user", status: 403 });

				let infoCommentAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_UPDATE}`, {
					commentID, content
				});

				if(!infoCommentAfterUpdate && infoCommentAfterUpdate.error)
					return resolve({ error: true, message: "Can't add comment", status: 403 });

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
							console.log('file: ', file);
							console.log('infoFile: ', infoFile);

                            // Update status file core collection
                            await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.UPDATE_STATUS_FILE}`, {
                                fileID: infoFile.data && infoFile.data._id.toString(),
                                status: "1",
                                userID: authorID,
                            });

							let deleteCommentFileMedia = await MEDIA_COMMENT_FILE_COLL.deleteMany({ comment: commentID })

							let infoCommentFileMediaAfterInsert = await MEDIA_COMMENT_FILE_COLL.create({ 
								comment: commentID,
								file: infoFile.data && infoFile.data._id.toString(),
								createAt: timeUtils.getCurrentTime(),
								modifyAt: timeUtils.getCurrentTime()
							});

							if(!infoCommentFileMediaAfterInsert)
								return resolve({ error: true, message: "Can't upload comment file in media", status: 403 });

                        })
                }

                return resolve({ error: false, data: infoCommentAfterUpdate.data, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA COMMENT ẢNH TRONG BÀI VIẾT
	 */
	deleteCommentImageMedia({ authorID, commentID, ctx }){
		return new Promise(async resolve => {
			try {

				console.log({commentID})
				if(!checkObjectIDs([authorID, commentID]))
                    return resolve({ error: true, message: 'Request params invalid', status: 400 });

				let deleteCommentOfUser = await MEDIA_COMMENT_IMAGE_COLL.deleteMany({ 
					author: authorID,
					comment: commentID,
				});

				let deleteCommentChild = await MEDIA_COMMENT_IMAGE_COLL.deleteMany({ 
					parent: commentID,
				});
		
				let deleteCommentFileMedia = await MEDIA_COMMENT_FILE_COLL.deleteMany({ comment: commentID })

				if(!deleteCommentOfUser)
					return resolve({ error: true, message: "Can't delete comment of user", status: 403 });

                return resolve({ error: false, data: deleteCommentOfUser, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
		})
	}

	/**
	 * Dev: NPNguyen 🐸
	 * Func: TRẢ LỜI COMMENT ẢNH TRONG BÀI VIẾT
	 */
	replyCommentImageMedia({ authorID, imageID, commentID, content, files, ctx }){
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

				let infoCommentParent = await MEDIA_COMMENT_IMAGE_COLL.findById(commentID);

				let infoCommentMediaAfterInsert = await MEDIA_COMMENT_IMAGE_COLL.create({ 
					author: authorID,
					image: imageID,
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