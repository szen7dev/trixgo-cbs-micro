"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			= require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__TEMPLATE_DOC_COMMENT_COLL    = require('../database/inspection.template_doc_comment-coll');
const INSPECTION__TEMPLATE_DOC_COLL             = require('../database/inspection.template_doc-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
class Model extends BaseModel {

    constructor() {
        super(INSPECTION__TEMPLATE_DOC_COMMENT_COLL);
    }
        
    /**
     * Thêm mẩu tin: HiepNH ✅
     * F0211
     */
    insert({ template, comment, parent }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(comment, template))
                    return resolve({ error: true, message: 'Request params reaction or comment invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataInsert = { comment, template };
                if(parent){
                    dataInsert.parent = parent;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert); 
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create template docs reaction", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Xóa template docs: DePV ✅
     * F0213
     */
    remove({ commentID }) { 
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
                if(!checkObjectIDs(commentID))
                    return resolve({ error: true, message: 'Request params templateDocReactionID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoDataAfterUpdate = await INSPECTION__TEMPLATE_DOC_COMMENT_COLL.findByIdAndDelete(commentID);
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove template docs", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Danh sách template docs: DePV ✅
     * F0214
     * problem: Bị hạn chế không thể sort createAt = 1
     */
    getListTemplateDoc({ templateDocReactionID, limit = 10, lastestIDTemplateDocReaction  }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { template: templateDocReactionID };
                let conditionFind = {};
                let sortBy = { createAt: -1 };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
				if(lastestIDTemplateDocReaction && checkObjectIDs(lastestIDTemplateDocReaction)){
					let infoMessage = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.findById(lastestIDTemplateDocReaction);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoMessage.createAt}_${infoMessage._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
                    // console.log({ nextInfo });
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}

                let infoDataAfterGet = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.find({...conditionObj, ...conditionFind })
                    .select("reaction")
                    .populate({
                        path: "reaction",
                        select: "type author"
                    })
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.count(conditionFind);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get template docs", status: 403 });
                
                let totalPage = Math.ceil(totalRecord/limit);
                let currentPage = getCurrentPage({ totalRecord, totalCurrentPage, limit });
                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    currentPage
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;