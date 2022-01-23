"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			= require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__TEMPLATE_DOC_REACTION_COLL    = require('../database/inspection.template_doc_reaction-coll');
const INSPECTION__TEMPLATE_DOC_COLL             = require('../database/inspection.template_doc-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
class Model extends BaseModel {

    constructor() {
        super(INSPECTION__TEMPLATE_DOC_REACTION_COLL);
    }
        
    /**
     * Thêm mẩu tin: HiepNH ✅
     * F0211
     */
    insert({ template, reaction, author }) { 
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
                if(!checkObjectIDs(reaction, template, author))
                    return resolve({ error: true, message: 'Request params reaction or template or author invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let checkUserReactionExist = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.findOne({ template, author });
                let infoDataAfterInserted;
                if(!checkUserReactionExist){
                    infoDataAfterInserted = await this.insertData({ 
                        reaction, template, author
                    });
                    // Cập nhật lại numLike
                    await INSPECTION__TEMPLATE_DOC_COLL.findByIdAndUpdate(template , { $inc: { numLike: 1 }});

                }else{
                    infoDataAfterInserted = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.findByIdAndUpdate(checkUserReactionExist._id, {
                        reaction
                    }, { new: true })
                }

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
    remove({ templateDocReactionID }) { 
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
                if(!checkObjectIDs(templateDocReactionID))
                    return resolve({ error: true, message: 'Request params templateDocReactionID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoDataAfterUpdate = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.findByIdAndDelete(templateDocReactionID);
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove template docs", status: 403 });

                let { template } = infoDataAfterUpdate;

                // Cập nhật lại numLike
                await INSPECTION__TEMPLATE_DOC_COLL.findByIdAndUpdate(template , { $inc: { numLike: -1 }});

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
    getListTemplateDoc({ templateID, limit = 10, lastestIDReaction  }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { template: templateID };
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
				if(lastestIDReaction && checkObjectIDs(lastestIDReaction)){
					let infoMessage = await INSPECTION__TEMPLATE_DOC_REACTION_COLL.findById(lastestIDReaction);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoMessage.createAt}_${infoMessage._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
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
                    return resolve({ error: true, message: "Can't get reaction template docs", status: 403 });
                
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