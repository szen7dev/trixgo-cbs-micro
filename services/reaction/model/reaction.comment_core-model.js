"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * COLLECTION
 */
const REACTION__COMMENT_COLL            = require('../database/reaction.comment_core-coll');

class Model extends BaseModel {
    constructor() {
        super(REACTION__COMMENT_COLL);
    }
    /**
     * Name: Thêm comment core
     * Author: Depv
     * Code: F0271
     */
    insert({ content, files, images, userID }) {
        const that = this;
        return new Promise(async (resolve) => {
             try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                  return resolve({ error: true, message: "Request params userID invalid" });

                if(!content)
                    return resolve({ error: true, message: "Request params content invalid" })
                
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    

                dataInsert.content  = content;
                dataInsert.author   = userID;

                if(checkObjectIDs(files)){
                    dataInsert.files    = files;
                }

                if(checkObjectIDs(images)){
                    dataInsert.images    = images;
                }

                let infoAfterInsert = await that.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Sửa comment core
     * Author: Depv
     * Code: F0272
     */
    update({ commentCoreID, content, files, filesRemove, images, imagesRemove, amountCommentReply, amountReaction }) {
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
                if(!checkObjectIDs(commentCoreID))
                    return resolve({ error: true, message: "Request params commentCoreID invalid" });

                if(!content)
                    return resolve({ error: true, message: "Request params content invalid" });

               /**
                * LOGIC STEP (3)
                *  3.1: convert type + update name (ví dụ: string -> number)
                *  3.2: operation database
                */    
                dataUpdate.content = content;

                if(amountCommentReply){
                    dataUpdate.$inc = {
                        amountCommentReply
                    }
                }

                if(amountReaction){
                    dataUpdate.$inc = {
                        amountReaction
                    }
                }
                let dataAddToSet = {};
                let dataPull     = {};
                // CẬP NHẬT FILE MỚI
                if(checkObjectIDs(files)){
                    dataAddToSet.files = files;
                }

                // CẬP NHẬT HÌNH ẢNH MỚI
                if(checkObjectIDs(images)){
                    dataAddToSet.images = images;
                }
                
                // CẬP NHẬT XÓA FILE CŨ
                if(checkObjectIDs(filesRemove)){
                    dataPull.files = filesRemove;
                }

                // CẬP NHẬT XÓA HÌNH ẢNH CŨ
                if(checkObjectIDs(imagesRemove)){
                    dataPull.images = imagesRemove;
                }

                if(dataAddToSet){
                    dataUpdate.$addToSet = dataAddToSet;
                }

                let infoAfterAction = await REACTION__COMMENT_COLL.findByIdAndUpdate(commentCoreID, dataUpdate, {
                    new: true
                });

                if(!infoAfterAction)
                    return resolve({ error: true, message: 'cannot_update' });

                // Trường hợp này không thể sử dung $pull hoặc $addToSet cùng lúc được nên mình xử lý $pull sau
                if(dataPull){
                    let infoAfterAction = await REACTION__COMMENT_COLL.findByIdAndUpdate(commentCoreID, { $pull: dataPull }, {
                        new: true
                    });
                    console.log({ infoAfterAction });

                }

                return resolve({ error: false, data: infoAfterAction});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
       })
    }

    /**
     * Name: Lấy thông tin comment core ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ commentCoreID, select, populates, populates1, populates2, populates3 }){
        return new Promise(async resolve => {
            try {

                if (!checkObjectIDs(commentCoreID))
                    return resolve({ error: true, message: 'param_invalid' });

                // populates
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
                // populates1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}
                // populates2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}
                
                // populates3
                if(populates3 && typeof populates3 === 'string'){
					if(!IsJsonString(populates3))
						return resolve({ error: true, message: 'Request params populates3 invalid', status: 400 });

					populates3 = JSON.parse(populates3);
				}

                let infoComment = await REACTION__COMMENT_COLL.findById(taskID)
                                .select(select)
                                .populate({
                                    path: populates?.value || "",
                                    select: populates?.select || "",
                                    populate: {
                                        path: populates1?.value ||"",
                                        select: populates1?.select || "",
                                        populate: {
                                            path: populates2?.value || "",
                                            select: populates2?.select || "",
                                            populate: {
                                                path: populates3?.value || "",
                                                select: populates3?.select || "",
                                            }
                                        }
                                    }
                                })

				if (!infoComment) return resolve({ error: true, message: 'cannot_get_info_comment' });

                return resolve({ error: false, data: infoComment });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}
exports.MODEL = new Model;