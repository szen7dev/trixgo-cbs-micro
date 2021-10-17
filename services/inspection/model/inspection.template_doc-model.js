"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			= require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__TEMPLATE_DOC_COLL    = require('../database/inspection.template_doc-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
class Model extends BaseModel {

    constructor() {
        super(INSPECTION__TEMPLATE_DOC_COLL);
    }

    
    /**
     * Thêm mẩu tin: HiepNH ✅
     * F0211
     */
    insert({ type, name, sign, description, authorID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                // let name;
                // let sign;

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                if (!sign || sign == '')
                    return resolve({ error: true, message: 'sign_invalid', status: 400 });

                if(![1, 2, 3, 4].includes(+type))
                    return resolve({ error: true, message: 'type_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  

                let checkSignExist = await INSPECTION__TEMPLATE_DOC_COLL.findOne({ sign });
                if(checkSignExist)
                    return resolve({ error: true, message: 'sign_existed', status: 400 });

                let infoDataAfterInserted = await this.insertData({ 
					name, 
					sign, 
                    description,
                    type,
					userCreate: authorID,
				});

                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create template docs", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Cập nhật template docs: DePV ✅
     * F0212
     */
    update({ templateDocID, name, sign, description, authorID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(authorID, templateDocID))
                    return resolve({ error: true, message: 'Request params authorID or templateDocID invalid', status: 400 });

                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                if (!sign || sign == '')
                    return resolve({ error: true, message: 'sign_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  

                dataUpdate.name = name;

                // Kiểm tra sign đã tồn tại hay chưa
                let checkSignExist = await INSPECTION__TEMPLATE_DOC_COLL.findOne({ sign, _id: { $ne: templateDocID }});
                if(checkSignExist)
                    return resolve({ error: true, message: 'sign_existed', status: 400 });

                dataUpdate.sign = sign;
                dataUpdate.description = description;
                dataUpdate.modifyAt = new Date();
                dataUpdate.updateAt = new Date();
                let infoDataAfterUpdate = await INSPECTION__TEMPLATE_DOC_COLL.findByIdAndUpdate(templateDocID, dataUpdate, { new: true });

                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update template doc", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Xóa template docs: DePV ✅
     * F0213
     */
    remove({ templateDocID }) { 
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
                if(!checkObjectIDs(templateDocID))
                    return resolve({ error: true, message: 'Request params templateDocID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoDataAfterUpdate = await INSPECTION__TEMPLATE_DOC_COLL.findByIdAndUpdate(templateDocID, { state: 2 }, { new: true });

                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove template docs", status: 403 });

                return resolve({ error: false, message: "Remove Success", status: 200 });
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
    getListByType({ type, keyword, limit = 10, lastestIDTemplate  }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { type, state: 1 };
                let conditionFind = {};
                let sortBy = { createAt: -1 };
				let objSort 	 	= {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(![1, 2, 3, 4].includes(+type))
                    return resolve({ error: true, message: 'type_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
				if(lastestIDTemplate && checkObjectIDs(lastestIDTemplate)){
					let infoMessage = await INSPECTION__TEMPLATE_DOC_COLL.findById(lastestIDTemplate);
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

                // SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let infoDataAfterGet = await INSPECTION__TEMPLATE_DOC_COLL.find({...conditionObj, ...conditionFind }, objSort)
                    .select("name userCreate modifyAt sign")
                    .populate({
                        path: "userCreate",
                        select: "fullname"
                    })
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__TEMPLATE_DOC_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__TEMPLATE_DOC_COLL.count(conditionFind);

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

    /**
     * Lấy thông tin template DePV ✅
     * F0214A
     */
    getInfo({ templateID }) { 
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
                if(!checkObjectIDs(templateID))
                    return resolve({ error: true, message: 'Request params templateID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoAfterHandel = await INSPECTION__TEMPLATE_DOC_COLL.findById(templateID);

                if(!infoAfterHandel)
                    return resolve({ error: true, message: "Can't get info template docs", status: 403 });

                return resolve({ error: false, data: infoAfterHandel, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;