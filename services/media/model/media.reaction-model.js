"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }         = require('../../../tools/cursor_base/playground/index');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 		    = require('../../reaction/helper/reaction.actions-constant');
const { REACTION_TYPES }			    = require('../helper/media.keys-constant');

/**s
 * import inter-coll, exter-coll
 */
const MEDIA__REACTION_COLL              = require('../database/media.reaction-coll');
const MEDIA__FILE_REACTION_COLL			= require('../database/media.reaction_file-coll');
const MEDIA_COLL                        = require('../database/media-coll');
const MEDIA__FILE_COLL                  = require('../database/media.file-coll');


class Model extends BaseModel {               

    constructor() {
        super(MEDIA__REACTION_COLL);
    }

    /**
	 * Dev: MinhVH
	 * Func: REACTION BÀI VIẾT
	 */
	reaction({ authorID, mediaID, typeReaction, ctx }) {
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
				const infoReaction = await MEDIA__REACTION_COLL
					.findOne({
						media: mediaID,
						file: { $exists: false },
						comment: { $exists: false },
						userCreate: authorID
					})
					.populate('reaction')
					.lean();

				if(infoReaction && +infoReaction?.reaction?.type === typeReaction){
					const infoAfterDeleteReaction = await MEDIA__REACTION_COLL.findByIdAndDelete(infoReaction._id);

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
					await MEDIA__REACTION_COLL.findByIdAndDelete(infoReaction._id);
				}

				const infoAfterUpdateReaction = await this.insertData({
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
	 * Dev: MinhVH
	 * Func: DANH SÁCH REACTION BÀI VIẾT
	 */
	getListReaction({ userID, mediaID, lastestID, limit = 20, select, populates = {} }) {
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
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Tham số populates không hợp lệ', status: 400 });

					populates = JSON.parse(populates);
				} else{
					populates = {
						path: '',
						select: ''
					}
				}

				let conditionObj = { media: mediaID };
				let conditionFind = {};
                let sortBy = {
                    _id: -1,
					createAt: -1,
                }

				if(lastestID && checkObjectIDs([lastestID])){
                    let infoReaction = await MEDIA__REACTION_COLL.findById(lastestID);
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

				const listReactionMedia = await MEDIA__REACTION_COLL
					.find({ ...conditionObj, ...conditionFind })
					.select(select)
					.limit(limit + 1)
					.sort(sortBy)
					.populate(populates)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await MEDIA__REACTION_COLL.countDocuments(conditionObj);
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

	/**
	 * Dev: MinhVH
	 * Func: REACTION FILE
	 */
	reactionFile({ authorID, mediaID, fileID, typeReaction, ctx }) {
		return new Promise(async resolve => {
			try {
				if(!typeReaction || !REACTION_TYPES.includes(typeReaction)) {
                    typeReaction = 1;
				}

				if(!checkObjectIDs([authorID, mediaID, fileID])) {
                    return resolve({
						error: true, 
						message: 'Tham số mediaID hoặc authorID, fileID không hợp lệ', 
						keyError: 'params_messageID_or_authorID_or_fileID_invalid',
						status: 400
					});
				}

				const infoMedia = await MEDIA_COLL
					.findById(mediaID)
					.lean();

				if(!infoMedia) {
					return resolve({
						error: true, 
						message: 'Media không tồn tại', 
						keyError: 'media_is_not_exists',
						status: 400
					});
				}

				// Kiểm tra đã thả cảm xúc trên bài viết
				const infoReaction = await MEDIA__FILE_REACTION_COLL
					.findOne({
						file: fileID,
						media: mediaID,
						userCreate: authorID
					})
					.populate('reaction')
					.lean();

				if(infoReaction && +infoReaction?.reaction?.type === typeReaction){
					const infoAfterDeleteReaction = await MEDIA__FILE_REACTION_COLL.findByIdAndDelete(infoReaction._id);

					await MEDIA__FILE_COLL.findByIdAndUpdate(fileID, {
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
					await MEDIA__FILE_REACTION_COLL.findByIdAndDelete(infoReaction._id);
				}

				const infoAfterUpdateReaction = await MEDIA__FILE_REACTION_COLL.create({
					file: fileID,
					media: mediaID,
					reaction: infoAfterInsertReaction?.data?._id,
					userCreate: authorID,
				})

				if(!infoAfterUpdateReaction) {
					return resolve({
						error: true, 
						message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục', 
						keyError: 'error_occurs',
						status: 422
					});
				}

				await MEDIA__FILE_COLL.findByIdAndUpdate(mediaID, {
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
	 * Dev: MinhVH
	 * Func: DANH SÁCH REACTION FILE
	 */
	getListReactionFile({ userID, fileID, mediaID, lastestID, limit = 20, select, populates = {} }) {
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([userID])) {
                    return resolve({
						error: true, 
						message: 'Tham số user ID không hợp lệ', 
						keyError: 'params_userID_invalid',
						status: 400
					});
				}

				if(!checkObjectIDs([mediaID, fileID])) {
                    return resolve({
						error: true, 
						message: 'Tham số mediaID hoặc fileID không hợp lệ', 
						keyError: 'params_mediaID_or_fileID_invalid',
						status: 400
					});
				}

				if(isNaN(limit) || limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Tham số populates không hợp lệ', status: 400 });

					populates = JSON.parse(populates);
				} else{
					populates = {
						path: '',
						select: ''
					}
				}

				let conditionObj = { media: mediaID, file: fileID };
				let conditionFind = {};
                let sortBy = {
                    _id: -1,
					createAt: -1,
                }

				if(lastestID && checkObjectIDs([lastestID])){
                    let infoReaction = await MEDIA__FILE_REACTION_COLL.findById(lastestID);
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

				const listReactionFile = await MEDIA__FILE_REACTION_COLL
					.find({ ...conditionObj, ...conditionFind })
					.select(select)
					.limit(limit + 1)
					.sort(sortBy)
					.populate(populates)
					.lean();

				// GET TOTAL RECORD
				let totalRecord = await MEDIA__FILE_REACTION_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listReactionFile && listReactionFile.length){
					if(listReactionFile.length > limit){
						nextCursor = listReactionFile[limit - 1]._id;
						listReactionFile.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listReactionFile,
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