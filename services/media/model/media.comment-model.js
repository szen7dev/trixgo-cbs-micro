"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 }      = require('../../../tools/cursor_base/playground/index');

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
    insert({ mediaID, parentID, content, files, images, authorID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                let dataInsert = {  
                    media: mediaID,
                    author: authorID
                }

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([mediaID])) {
                    return resolve({
                        error: true,
                        message: "Tham số mediaID không hợp lệ",
                        keyError: "params_mediaID_invalid",
                        status: 400
                    })
                }

                if(!checkObjectIDs([authorID])) {
                    return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
                        keyError: "params_authorID_invalid",
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

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                if(parentID) {
                    if(!checkObjectIDs([parentID])) {
                        return resolve({
                            error: true,
                            message: "Tham số parentID không hợp lệ",
                            keyError: "params_parentID_invalid",
                            status: 400
                        })
                    }

                    dataInsert.parent = parentID;
                }

                content && (dataInsert.content  = content);
                files   && (dataInsert.files    = files);
                images  && (dataInsert.images   = images);

                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    })
                }

                if(parentID){
                    await MEDIA__COMMENT_COLL.findByIdAndUpdate(parentID, { 
                        $set: {
                            lastestReplyID: infoAterInsert._id
                        },
                        $inc: {
                            amountCommentReply: 1
                        }
                    });
                }

                // Cập nhật số lượng comment
                await MEDIA_COLL.findByIdAndUpdate(mediaID, {
                    $inc: {
                        amountComment: 1
                    }
                })

                infoAterInsert = await MEDIA__COMMENT_COLL
                    .findById(infoAterInsert._id)
                    .select(select)
                    .populate(populates)
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
     * Func: Update comment media
     * Date: 22/02/2022
     */ 
    update({ commentID, authorID, content, files, images, select, populates }) {
        return new Promise(async (resolve) => {
            try {
               /**
                * DECALARTION VARIABLE (1)
                */
               let dataUpdate = {};

               /** 
                * VALIDATION STEP (2)
                *  - kiểm tra valid từ các input
                *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                */
                if(!checkObjectIDs([commentID])) {
                    return resolve({
                        error: true,
                        message: "Tham số commentID không hợp lệ",
                        keyError: "params_commentID_invalid",
                        status: 400
                    })
                }

                if(!checkObjectIDs([authorID])) {
                    return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
                        keyError: "params_authorID_invalid",
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

               /**
                * LOGIC STEP (3)
                *  3.1: convert type + update name (ví dụ: string -> number)
                *  3.2: operation database
                */    
                content && (dataUpdate.content = content);

                // CẬP NHẬT FILE MỚI
                if(files.length && checkObjectIDs(files)){
                    dataUpdate.files = files;
                } else{
                    dataUpdate.files = [];
                }

                // CẬP NHẬT HÌNH ẢNH MỚI
                if(images.length && checkObjectIDs(images)){
                    dataUpdate.images = images;
                } else{
                    dataUpdate.images = [];
                }

                let infoAfterUpdate = await MEDIA__COMMENT_COLL.findOneAndUpdate({
                    _id: commentID,
                    author: authorID
                }, dataUpdate);

                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    })
                }

                infoAfterUpdate = await MEDIA__COMMENT_COLL
                    .findById(commentID)
                    .select(select)
                    .populate(populates)
                    .lean();

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
       })
    }

    /**
	 * Dev: MinhVH
	 * Func: Delete comment media
	 */
	delete({ authorID, commentID }) {
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

                if(!checkObjectIDs([commentID])) {
                    return resolve({
                        error: true,
                        message: "Tham số commentID không hợp lệ",
                        keyError: "params_commentID_invalid",
                        status: 400
                    })
                }

                let infoComment = await MEDIA__COMMENT_COLL
                    .findOne({ _id: commentID, author: authorID })
                    .lean();

                if(!infoComment) {
                    return resolve({
                        error: true,
                        message: "Comment không tồn tại hoặc bạn không phải người tạo comment",
                        keyError: "comment_not_exists_or_you_are_not_author_of_comment",
                        status: 400
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

                if(infoComment.parent){
                    // Cập nhật số lượng comment reply trong comment cha
                    await MEDIA__COMMENT_COLL.findByIdAndUpdate(infoComment.parent, {
                        $inc: {
                            amountCommentReply: -1
                        }
                    })
                }

                // Cập nhật số lượng comment trong media
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
    getList({ mediaID, parentID, limit = 5, lastestID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { media: mediaID };
                let keys = ['createAt__-1', '_id__-1']
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

                if(isNaN(limit) || +limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

                if(checkObjectIDs([parentID])){
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

				let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await MEDIA__COMMENT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await MEDIA__COMMENT_COLL
                    .find(conditionObj)
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

                let totalRecord = await MEDIA__COMMENT_COLL.countDocuments(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord / limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
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
    insertCommentFile({ mediaID, fileID, parentID, content, files, images, select, populates, authorID }) { 
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

                if(!checkObjectIDs([authorID])){
                    return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
                        keyError: "params_authorID_invalid",
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

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let dataInsert = {  
                    media: mediaID,
                    file: fileID,
                    author: authorID,
                    createAt: new Date()
                }

                if(parentID) {
                    if(!checkObjectIDs([parentID])) {
                        return resolve({
                            error: true,
                            message: "Tham số parentID không hợp lệ",
                            keyError: "params_parentID_invalid",
                            status: 400
                        })
                    }

                    dataInsert.parent = parentID;
                }

                content && (dataInsert.content  = content);
                files   && (dataInsert.files    = files);
                images  && (dataInsert.images   = images);

                let infoAterInsert = await MEDIA__COMMENT_FILE_COLL.create(dataInsert);
                if(!infoAterInsert) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
                }

                if(parentID){
                    await MEDIA__COMMENT_FILE_COLL.findByIdAndUpdate(parentID, { 
                        $set: {
                            lastestReplyID: infoAterInsert._id
                        },
                        $inc: {
                            amountCommentReply: 1
                        }
                    });
                }

                // Cập nhật số lượng comment
                await MEDIA__FILE_COLL.findByIdAndUpdate(fileID, {
                    $inc: {
                        amountComment: 1
                    }
                })

                infoAterInsert = await MEDIA__COMMENT_FILE_COLL
                    .findById(infoAterInsert._id)
                    .select(select)
                    .populate(populates)
                    .lean();

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Update comment media file
     * Date: 22/02/2022
     */ 
    updateCommentFile({ commentID, authorID, content, files, images, select, populates }) {
        return new Promise(async (resolve) => {
            try {
               /**
                * DECALARTION VARIABLE (1)
                */
               let dataUpdate = {};

               /** 
                * VALIDATION STEP (2)
                *  - kiểm tra valid từ các input
                *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                */
                if(!checkObjectIDs([commentID])) {
                    return resolve({
                        error: true,
                        message: "Tham số commentID không hợp lệ",
                        keyError: "params_commentID_invalid",
                        status: 400
                    })
                }

                if(!checkObjectIDs([authorID])) {
                    return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
                        keyError: "params_authorID_invalid",
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

               /**
                * LOGIC STEP (3)
                *  3.1: convert type + update name (ví dụ: string -> number)
                *  3.2: operation database
                */    
                content && (dataUpdate.content = content);

                // CẬP NHẬT FILE MỚI
                if(files.length && checkObjectIDs(files)){
                    dataUpdate.files = files;
                } else{
                    dataUpdate.files = [];
                }

                // CẬP NHẬT HÌNH ẢNH MỚI
                if(images.length && checkObjectIDs(images)){
                    dataUpdate.images = images;
                } else{
                    dataUpdate.images = [];
                }

                let infoAfterUpdate = await MEDIA__COMMENT_FILE_COLL.findOneAndUpdate({
                    _id: commentID,
                    author: authorID
                }, dataUpdate);

                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    })
                }

                infoAfterUpdate = await MEDIA__COMMENT_FILE_COLL
                    .findById(commentID)
                    .select(select)
                    .populate(populates)
                    .lean();

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
       })
    }

    /**
	 * Dev: MinhVH
	 * Func: Delete comment file
	 */
	deleteCommentFile({ authorID, commentID }) {
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
                    .findOne({ _id: commentID, author: authorID })
                    .lean();

                if(!infoComment) {
                    return resolve({
                        error: true,
                        message: "Comment không tồn tại hoặc bạn không phải người tạo comment",
                        keyError: "comment_not_exists_or_you_are_not_author_of_comment",
                        status: 403
                    })
                }

                if(infoComment.parent){
                     // Cập nhật số lượng comment reply của comment parent
                    await MEDIA__COMMENT_FILE_COLL.findByIdAndUpdate(infoComment.parent, {
                        $inc: {
                            amountCommentReply: -1
                        }
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
	 * Func: List comment file
	 */
    getListCommentFile({ mediaID, fileID, parentID, limit = 5, lastestID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { media: mediaID, file: fileID };
                let keys = ['createAt__-1', '_id__-1']
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

                if(isNaN(limit) || +limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                } else{
                    conditionObj.parent = { $exists: false };
                }

				let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await MEDIA__COMMENT_FILE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await MEDIA__COMMENT_FILE_COLL
                    .find(conditionObj)
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

                let totalRecord = await MEDIA__COMMENT_FILE_COLL.countDocuments(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord / limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;