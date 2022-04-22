"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			= require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__DOC_REACTION_COLL    = require('../database/inspection.doc_reaction-coll');
const INSPECTION__DOC_COLL    = require('../database/inspection.doc-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
class Model extends BaseModel {

    constructor() {
        super(INSPECTION__DOC_REACTION_COLL);
    }
        
    /**
     * Name: Tạo mới reaction
     * Author: Depv
     * Code: F0240
     */
    insert({ inspection, reaction, author }) { 
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
                if(!checkObjectIDs(reaction, inspection, author))
                    return resolve({ error: true, message: 'Request params reaction or inspection or author invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let checkUserReactionExist = await INSPECTION__DOC_REACTION_COLL.findOne({ inspection, author });
                let infoDataAfterInserted;
                if(!checkUserReactionExist){
                    infoDataAfterInserted = await this.insertData({ 
                        reaction, inspection, author
                    });
                    // Cập nhật lại numLike
                    await INSPECTION__DOC_COLL.findByIdAndUpdate(inspection , { $inc: { numLike: 1 }});

                }else{
                    infoDataAfterInserted = await INSPECTION__DOC_REACTION_COLL.findByIdAndUpdate(checkUserReactionExist._id, {
                        reaction
                    }, { new: true })
                }

                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create reaction", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Xóa reaction: DePV 
     * Author: Depv
     * Code: F0240A
     */
    remove({ docReactionID }) { 
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
                if(!checkObjectIDs(docReactionID))
                    return resolve({ error: true, message: 'Request params docReactionID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoDataAfterUpdate = await INSPECTION__DOC_REACTION_COLL.findByIdAndDelete(docReactionID);
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove docs reaction", status: 403 });

                let { inspection } = infoDataAfterUpdate;

                // Cập nhật lại numLike
                await INSPECTION__DOC_COLL.findByIdAndUpdate(inspection , { $inc: { numLike: -1 }});

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Danh sách template docs 
     * Author: DePV
     * Code: F0240B
     * problem: Bị hạn chế không thể sort createAt = 1
     */
    getListReactions({ inspectionID, limit = 10, lastestIDReaction  }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { inspection: inspectionID };
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
					let infoMessage = await INSPECTION__DOC_REACTION_COLL.findById(lastestIDReaction);
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

                let infoDataAfterGet = await INSPECTION__DOC_REACTION_COLL.find({...conditionObj, ...conditionFind })
                    .select("reaction")
                    .populate({
                        path: "reaction",
                        select: "type author"
                    })
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__DOC_REACTION_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__DOC_REACTION_COLL.count(conditionFind);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get reaction docs", status: 403 });
                
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