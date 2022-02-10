"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 		    = require('../../reaction/helper/reaction.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const MEDIA__COMMENT_COLL               = require('../database/media.comment-coll');
const MEDIA_COLL                        = require('../database/media-coll');
const { RANGE_BASE_PAGINATION }         = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(MEDIA__COMMENT_COLL);
    }

    /**
     * Name: insert comment media ✅
     * Author: Depv
     * Code: 
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
	 * Dev: MinhVH 🐸
	 * Func: XÓA COMMENT	
	 */
	delete({ authorID, commentID, ctx }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(authorID))
					return resolve({ error: true, message: 'Request param authorID invalid', status: 400 });

                if(!checkObjectIDs(commentID))
					return resolve({ error: true, message: 'Request param commentID invalid', status: 400 });

                let infoComment = await MEDIA__COMMENT_COLL.findOne({ _id: commentID, userCreate: authorID }).populate('parent');

                if(!infoComment)
                    return resolve({ error: true, message: 'Not found info comment', status: 403 });

                if(infoComment.parent){
                    await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_UPDATE}`, {
                        commentID: `${infoComment?.parent?.comment}`,
                        amountCommentReply: -1
                    })
                }

				let infoCommentAfterDelete = await MEDIA__COMMENT_COLL.findByIdAndDelete(commentID);

				if (!infoCommentAfterDelete) {
                    return resolve({ error: true, message: "Can't delete comment", status: 422 });
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
     * Name: get info user_pcm_plan_report ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ commentID, select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(commentID))
                    return resolve({ error: true, message: 'param_invalid' });
                // populates
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
					populates = {
                        path: "",
                        select: ""
                    }
                }

                let infoComment = await MEDIA__COMMENT_COLL.findById(commentID)
                    .select(select)
                    .populate(populates)

				if (!infoComment) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: infoComment });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách comment ✅
     * Author: Depv
     * Code  :
     */
    getList({ mediaID, parentID, limit = 5, lastestID, select, populates = {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
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
                if(isNaN(limit) || limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}

                if(checkObjectIDs(mediaID)){
                    conditionObj.media = mediaID;
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
				}else{
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

                let infoDataAfterGet = await MEDIA__COMMENT_COLL.find({...conditionObj, ...conditionFind })
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean(); 

                // GET TOTAL RECORD
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

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
                let totalPage   = Math.ceil(totalRecord/limit);

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
}

exports.MODEL = new Model;