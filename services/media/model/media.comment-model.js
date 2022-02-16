"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }         = require('../../../tools/cursor_base/playground/index');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 		    = require('../../reaction/helper/reaction.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const MEDIA__COMMENT_COLL               = require('../database/media.comment-coll');
const MEDIA__COMMENT_FILE_COLL          = require('../database/media.comment_file-coll');
const MEDIA_COLL                        = require('../database/media-coll');
const MEDIA__FILE_COLL                  = require('../database/media.file-coll');

class Model extends BaseModel {               

    constructor() {
        super(MEDIA__COMMENT_COLL);
    }

    /**
	 * ============================ ****************** ===============================
	 * ============================    COMMENT MEDIA   ===============================
	 * ============================ ****************** ===============================
	 */

    /**
     * Dev: MinhVH
     * Func: Create comment media
     */
    insert({ mediaID, parentID, content, files, images, userID, ctx }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                let infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_INSERT}`, {
                    content, files, images
                })

                if(infoCommentCore.error)
                    return resolve(infoCommentCore);

                let commentCoreID = infoCommentCore.data._id;
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let dataInsert = {  
                    media: mediaID,
                    comment: commentCoreID,
                    userCreate: userID
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "can't_insert_comment_media ", status: 403 });

                if(checkObjectIDs(parentID)){
                    await MEDIA__COMMENT_COLL.findByIdAndUpdate(parentID, { 
                        lastestReplyID: infoAterInsert._id
                    });

                    const infoParent = await MEDIA__COMMENT_COLL.findById(parentID).select('comment');

                    await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_UPDATE}`, {
                        commentID: `${infoParent?.comment}`,
                        amountCommentReply: 1
                    })
                }

                // Cập nhật số lượng comment
                await MEDIA_COLL.findByIdAndUpdate(mediaID, {
                    $inc: {
                        amountComment: 1
                    }
                })

                infoAterInsert = await MEDIA__COMMENT_COLL
                    .findById(infoAterInsert._id)
                    .populate({
                        path: 'comment userCreate lastestReplyID',
                        select: '_id fullname image content files images amountCommentReply amountReaction createAt',
                        populate: {
                            path: 'files images comment userCreate lastestReplyID',
                            select: '_id name nameOrg path size type fullname image content files images amountCommentReply amountReaction',
                            populate: {
                                path: 'files images',
                                select: '_id name nameOrg path size type'
                            }
                        }
                    })
                    .lean();

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Delete comment media
	 */
	delete({ authorID, commentID, ctx }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs([authorID])) {
                    return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
                        keyError: "params_authorID_invalid",
                        status: 400
                    })
                }

                if(!checkObjectIDs([w])) {
                    return resolve({
                        error: true,
                        message: "Tham số commentID không hợp lệ",
                        keyError: "params_commentID_invalid",
                        status: 400
                    })
                }

                let infoComment = await MEDIA__COMMENT_COLL
                    .findOne({ _id: commentID, userCreate: authorID })
                    .populate('parent')
                    .lean();

                if(!infoComment) {
                    return resolve({
                        error: true,
                        message: "Comment không tồn tại",
                        keyError: "comment_not_exists",
                        status: 400
                    })
                }

                if(infoComment.parent){
                    await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_UPDATE}`, {
                        commentID: `${infoComment?.parent?.comment}`,
                        amountCommentReply: -1
                    })
                }

				let infoCommentAfterDelete = await MEDIA__COMMENT_COLL.findByIdAndDelete(commentID);

				if (!infoCommentAfterDelete) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
				}

                // Cập nhật số lượng comment
                await MEDIA_COLL.findByIdAndUpdate(infoComment.media, {
                    $inc: {
                        amountComment: -1
                    }
                })

				return resolve({ 
					error: false,
					status: 200,
					data: infoCommentAfterDelete
				});
			} catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Info comment media
	 */
    getInfo({ commentID, select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([commentID])) {
                    return resolve({
                        error: true,
                        message: "Tham số commentID không hợp lệ",
                        keyError: "params_commentID_invalid",
                        status: 400
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

                let infoComment = await MEDIA__COMMENT_COLL
                    .findById(commentID)
                    .select(select)
                    .populate(populates)
                    .lean();

				if (!infoComment) {
                    return resolve({
                        error: true,
                        message: "Comment không tồn tại",
                        keyError: "comment_not_exists",
                        status: 400
                    })
                }

                return resolve({ error: false, data: infoComment, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: List comment media
	 */
    getList({ mediaID, parentID, limit = 5, lastestID, select, populates = {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { media: mediaID };
                let conditionFind = {};
                let sortBy = {
					createAt: -1,
					_id: -1,
				};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([mediaID])) {
                    return resolve({
						error: true, 
						message: 'Tham số mediaID không hợp lệ', 
						keyError: 'params_mediaID_invalid',
						status: 400
					});
                }

                if(isNaN(limit) || limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                } else{
                    conditionObj.parent = { $exists: false };
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

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await MEDIA__COMMENT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last comment media", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
					let keys	 = ['createAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

                let infoDataAfterGet = await MEDIA__COMMENT_COLL
                    .find({...conditionObj, ...conditionFind })
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
                }

                let nextCursor	= null;

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }

                    infoDataAfterGet = infoDataAfterGet.reverse();
                    nextCursor	     = infoDataAfterGet[0]._id;
                }

                let totalRecord = await MEDIA__COMMENT_COLL.countDocuments(conditionObj);
                let totalPage   = Math.ceil(totalRecord / limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * ============================ ****************** ===============================
	 * ============================    COMMENT FILE    ===============================
	 * ============================ ****************** ===============================
	 */

    /**
     * Dev: MinhVH
     * Func: Create comment file
     */
    insertCommentFile({ mediaID, fileID, parentID, content, files, images, userID, ctx }) { 
        return new Promise(async (resolve) => {
            try {
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([mediaID, fileID])){
                    return resolve({
                        error: true,
                        message: "Tham số mediaID hoặc fileID không hợp lệ",
                        keyError: "params_mediaID_or_fileID_invalid",
                        status: 400
                    })
                }

                if(!checkObjectIDs([userID])){
                    return resolve({
                        error: true,
                        message: "Tham số userID không hợp lệ",
                        keyError: "params_userID_invalid",
                        status: 400
                    })
                }

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_INSERT}`, {
                    content, files, images
                })

                if(infoCommentCore.error)
                    return resolve(infoCommentCore);

                let commentCoreID = infoCommentCore.data._id;

                let dataInsert = {  
                    media: mediaID,
                    file: fileID,
                    comment: commentCoreID,
                    userCreate: userID,
                    createAt: new Date(),
                    modifyAt: new Date(),
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                let infoAterInsert = await MEDIA__COMMENT_FILE_COLL.create(dataInsert);
                if(!infoAterInsert) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
                }

                if(checkObjectIDs(parentID)){
                    await MEDIA__COMMENT_FILE_COLL.findByIdAndUpdate(parentID, { 
                        lastestReplyID: infoAterInsert._id
                    });

                    const infoParent = await MEDIA__COMMENT_FILE_COLL.findById(parentID).select('comment');

                    await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_UPDATE}`, {
                        commentID: `${infoParent?.comment}`,
                        amountCommentReply: 1
                    })
                }

                // Cập nhật số lượng comment
                await MEDIA__FILE_COLL.findByIdAndUpdate(fileID, {
                    $inc: {
                        amountComment: 1
                    }
                })

                infoAterInsert = await MEDIA__COMMENT_FILE_COLL
                    .findById(infoAterInsert._id)
                    .populate({
                        path: 'comment userCreate lastestReplyID',
                        select: '_id fullname image content files images amountCommentReply amountReaction createAt',
                        populate: {
                            path: 'files images comment userCreate lastestReplyID',
                            select: '_id name nameOrg path size type fullname image content files images amountCommentReply amountReaction',
                            populate: {
                                path: 'files images',
                                select: '_id name nameOrg path size type'
                            }
                        }
                    })
                    .lean();

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Delete comment file
	 */
	deleteCommentFile({ authorID, commentID, ctx }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs([authorID])) {
                    return resolve({
						error: true, 
						message: 'Tham số authorID không hợp lệ', 
						keyError: 'params_authorID_invalid',
						status: 400
					});
                }

                if(!checkObjectIDs([commentID])) {
                    return resolve({
						error: true, 
						message: 'Tham số commentID không hợp lệ', 
						keyError: 'params_commentID_invalid',
						status: 400
					});
                }

                let infoComment = await MEDIA__COMMENT_FILE_COLL
                    .findOne({ _id: commentID, userCreate: authorID })
                    .populate('parent file')
                    .lean();

                if(!infoComment) {
                    return resolve({
                        error: true,
                        message: "Comment không tồn tại",
                        keyError: "comment_not_exists",
                        status: 403
                    })
                }

                if(infoComment.parent){
                    await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_UPDATE}`, {
                        commentID: `${infoComment.parent?.comment}`,
                        amountCommentReply: -1
                    })
                }

				let infoCommentAfterDelete = await MEDIA__COMMENT_FILE_COLL.findByIdAndDelete(commentID);

				if (!infoCommentAfterDelete) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
				}

                // Cập nhật số lượng comment
                await MEDIA__FILE_COLL.findByIdAndUpdate(infoComment.file, {
                    $inc: {
                        amountComment: -1
                    }
                })

				return resolve({ 
					error: false,
					status: 200,
					data: infoCommentAfterDelete
				});
			} catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Info comment file
	 */
    getInfoCommentFile({ commentID, select, populates }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([commentID])) {
                    return resolve({
						error: true, 
						message: 'Tham số commentID không hợp lệ', 
						keyError: 'params_commentID_invalid',
						status: 400
					});
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

                let infoComment = await MEDIA__COMMENT_FILE_COLL
                    .findById(commentID)
                    .select(select)
                    .populate(populates)
                    .lean();

				if (!infoComment) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
                }

                return resolve({ error: false, data: infoComment, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: List comment file
	 */
    getListCommentFile({ mediaID, fileID, parentID, limit = 5, lastestID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { media: mediaID, file: fileID };
                let conditionFind = {};
                let sortBy = {
					createAt: -1,
					_id: -1,
				};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([mediaID, fileID])) {
                    return resolve({
						error: true, 
						message: 'Tham số mediaID hoặc fileID không hợp lệ', 
						keyError: 'params_mediaID_or_fileID_invalid',
						status: 400
					});
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

                if(isNaN(limit) || limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                } else{
                    conditionObj.parent = { $exists: false };
                }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await MEDIA__COMMENT_FILE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last comment file", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
					let keys	 = ['createAt__-1', '_id__-1'];

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

                let infoDataAfterGet = await MEDIA__COMMENT_FILE_COLL
                    .find({...conditionObj, ...conditionFind })
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
                }

                let nextCursor	= null;

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }

                    infoDataAfterGet = infoDataAfterGet.reverse();
                    nextCursor	     = infoDataAfterGet[0]._id;
                }

                let totalRecord = await MEDIA__COMMENT_FILE_COLL.countDocuments(conditionObj);
                let totalPage   = Math.ceil(totalRecord / limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;