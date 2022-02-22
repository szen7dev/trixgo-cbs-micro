"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs }  				= require('../../../tools/utils/utils');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 		    = require('../../reaction/helper/reaction.actions-constant');
const { REACTION_TYPES }			    = require('../helper/media.keys-constant');

/**
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
						message: 'Tham số mediaID hoặc authorID không hợp lệ', 
						keyError: 'params_mediaID_or_authorID_invalid',
						status: 400
					});
				}

				const infoMedia = await MEDIA_COLL
					.findById(mediaID)
					.lean();

				if(!infoMedia) {
					return resolve({
						error: true, 
						message: 'Bài viết không tồn tại', 
						keyError: 'media_is_not_exists',
						status: 400
					});
				}

				// Kiểm tra đã thả cảm xúc trên bài viết
				const infoReaction = await MEDIA__REACTION_COLL
					.findOne({
						media: mediaID,
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
					userCreate: authorID
				})

				if(!infoAfterUpdateReaction) {
					return resolve({
						error: true, 
						message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục', 
						keyError: 'error_occurred',
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
	getListReaction({ userID, mediaID, lastestID, isGetTotal, type, limit = 15, select, populates, ctx }) {
		return new Promise(async resolve => {
			try {
				console.log({
					userID, mediaID, lastestID, isGetTotal, type, limit, select, populates
				})
				if(!checkObjectIDs([userID])) {
                    return resolve({
						error: true, 
						message: 'Tham số user ID không hợp lệ', 
						keyError: 'params_userID_invalid',
						status: 400
					});
				}

				if(!checkObjectIDs([mediaID])) {
                    return resolve({
						error: true, 
						message: 'Tham số mediaID không hợp lệ', 
						keyError: 'params_mediaID_invalid',
						status: 400
					});
				}

				let conditionReactionCore = {};

				let listReactionsID = await MEDIA__REACTION_COLL
					.find({ media: mediaID })
					.select('reaction')
					.lean();

				if(listReactionsID.length) {
					listReactionsID = listReactionsID.map(reaction => reaction.reaction);
					type && (conditionReactionCore.type = type);

					const listReactions = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION__GET_INFO_AND_GET_LIST}`, {
						conditionObj: { ...conditionReactionCore, _id: { $in: listReactionsID } },
						lastestID,
						isGetTotal,
						select,
						populates,
						limit,
					});

					return resolve(listReactions);
				} else{
					return resolve({
						error: false,
						status: 200,
						data: {
							listRecords: [],
							limit: 20,
							totalRecord: 0,
							nextCursor: null
						}
					})
				}
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
						keyError: 'params_mediaID_or_authorID_or_fileID_invalid',
						status: 400
					});
				}

				const infoMedia = await MEDIA_COLL
					.findById(mediaID)
					.lean();

				if(!infoMedia) {
					return resolve({
						error: true, 
						message: 'Bài viết không tồn tại', 
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
	getListReactionFile({ userID, fileID, mediaID, lastestID, isGetTotal, type, limit, select, populates, ctx }) {
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([userID])) {
                    return resolve({
						error: true, 
						message: 'Tham số userID không hợp lệ', 
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

				let conditionReactionCore = {};

				let listReactionsID = await MEDIA__FILE_REACTION_COLL
					.find({ media: mediaID, file: fileID })
					.select('reaction')
					.lean();

				if(listReactionsID.length) {
					listReactionsID = listReactionsID.map(reaction => reaction.reaction);
					type && (conditionReactionCore.type = type);

					const listReactions = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION__GET_INFO_AND_GET_LIST}`, {
						conditionObj: { ...conditionReactionCore, _id: { $in: listReactionsID } },
						lastestID,
						isGetTotal,
						select,
						populates,
						limit,
					});

					return resolve(listReactions);
				} else{
					return resolve({
						error: false,
						status: 200,
						data: {
							listRecords: [],
							limit: 20,
							totalRecord: 0,
							nextCursor: null
						}
					})
				}
			} catch (error) {
				console.error(error);
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}
}

exports.MODEL = new Model;