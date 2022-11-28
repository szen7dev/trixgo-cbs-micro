"use strict";



// const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
// const ObjectID                          = require('mongoose').Types.ObjectId;

// const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, validateParamsObjectID }  = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { DOCTYPE_TYPE }                  = require('../helper/item.keys-constant');

/**
 * COLLECTIONS
 */
const ITEM__DOCTYPE_COLL                = require('../database/item.doctype-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__DOCTYPE_COLL);
    }

    /**
     * Dev: MinhVH
     * Func: Insert doctype
     * Date: 22/02/2022
     */
    insert({ type, name, description, sign, companyID, parent, level, userID }) {
        return new Promise(async resolve => {
            try {
                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });

                const dataInsert = { name, type, description, sign, company: companyID, userCreate: userID };

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!type || !DOCTYPE_TYPE.includes(+type)) {
                    return resolve({
						error: true,
						message: "Tham số type không hợp lệ",
						keyError: "params_type_invalid",
						status: 400
					})
                }

                if(!checkObjectIDs([userID])) {
                    return resolve({
						error: true,
						message: "Tham số userID không hợp lệ",
						keyError: "params_userID_invalid",
						status: 400
					})
                }

                if(!checkObjectIDs([companyID])) {
                    return resolve({
						error: true,
						message: "Tham số companyID không hợp lệ",
						keyError: "params_companyID_invalid",
						status: 400
					})
                }

                if(parent) {
                    if(!checkObjectIDs([parent])) {
                        return resolve({
                            error: true,
                            message: "Tham số parent không hợp lệ",
                            keyError: "params_parent_invalid",
                            status: 400
                        })
                    }

                    dataInsert.parent = parent;
                }

                if(level) {
                    dataInsert.level = level;
                }

                let infoAfterInsert = await this.insertData(dataInsert);

                if(!infoAfterInsert) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                if(parent) {
                    await ITEM__DOCTYPE_COLL.findByIdAndUpdate(parent, {
                        $addToSet: {
                            childs: infoAfterInsert._id
                        },
                        $inc: { amountChilds: 1 }
                    });
                }

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Update doctype
     * Date: 22/02/2022
     */
    update({ doctypeID, name, description, sign, userID }) {
        return new Promise(async resolve => {
            try {
                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });

                const dataUpdate = { userUpdate: userID, modifyAt: new Date() };

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([doctypeID, userID])) {
                    return resolve({
						error: true,
						message: "Tham số doctypeID hoặc userID không hợp lệ",
						keyError: "params_doctypeID_or_userID_invalid",
						status: 400
					})
                }

                name        && (dataUpdate.name = name);
                description && (dataUpdate.description = description);
                sign && (dataUpdate.sign = sign);

                let infoAfterUpdate = await ITEM__DOCTYPE_COLL.findByIdAndUpdate(doctypeID, dataUpdate, { new: true });

                if(!infoAfterUpdate) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Remove doctype => KHÔNG CHO PHÉP XÓA CÁC DANH MỤC
     * Date: 22/02/2022
     */
    remove({ doctypesID, userID }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({
                    doctypesID,
                    userID
                })
                if(validation.error) return resolve(validation);

                const result = await ITEM__DOCTYPE_COLL.deleteMany({
                    _id: {
                        $in: doctypesID
                    },
                    type: 21 // Message NPS
                });

                if(!result) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                return resolve({ error: false, status: 200, data: result })
            } catch(error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: get Hợp đồng
     * Author: Depv
     * Code:
     */
    getInfo({ doctypeID, select, populates }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(doctypeID))
                    return resolve({ error: true, message: 'Request params doctypeID invalid', status: 400 });

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
                let infoAterGet = await ITEM__DOCTYPE_COLL
                    .findById(doctypeID)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoAterGet) {
                    return resolve({
                        error: true,
                        message: "Doctype không tồn tại",
                        keyError: "doctype_not_exists",
                        status: 400
                    })
                }

                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách hợp đồng
     * Author: Depv
     * Code  :
     */
    getList({ companyID, projectID, parentID, type, keyword, limit = 10, lastestID, select, populates, isShowParentAndChild }) {
        return new Promise(async (resolve) => {
            try {
                if(isNaN(limit) || +limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let sortBy = {};
                let keys = ['createAt__-1', '_id__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
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
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                // TRẠNG THÁI CÔNG VIỆC
                //____________Công ty
                if(checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                //____________Dự án
                if(checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }

                //____________Doctype con
                if(checkObjectIDs(parentID)) {
                    conditionObj.parent = parentID;
                } else{
                    conditionObj.$or = [{
                        parent: { $exists: false },
                    }, { parent: null }]
                }

                if(isShowParentAndChild == 1){
                    delete conditionObj.$or;
                }

                //____________Loại doctype
                if(type){
                    conditionObj.type = type;
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }
                let conditionObjOrg = { ...conditionObj }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__DOCTYPE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await ITEM__DOCTYPE_COLL
                    .find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await ITEM__DOCTYPE_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

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