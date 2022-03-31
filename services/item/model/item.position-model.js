"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
 */
const ITEM__POSITION_COLL               = require('../database/item.position-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__POSITION_COLL);
    }

     /**
     * Dev: MinhVH
     * Func: Insert position
     * Date: 30/02/2022
     */
    insert({ name, description, companyID, parent, userID }) { 
        return new Promise(async resolve => {
            try {
                const dataInsert = { name, description, company: companyID, userCreate: userID };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

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

                let infoAterInsert = await this.insertData(dataInsert);

                if(!infoAterInsert) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Update position
     * Date: 30/02/2022
     */
    update({ positionID, name, description, userID }) { 
        return new Promise(async resolve => {
            try {
                const dataUpdate = { userUpdate: userID, modifyAt: new Date() };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([positionID, userID])) {
                    return resolve({
						error: true,
						message: "Tham số positionID hoặc userID không hợp lệ",
						keyError: "params_positionID_or_userID_invalid",
						status: 400
					})
                }

                name        && (dataUpdate.name = name);
                description && (dataUpdate.description = description);

                let infoAterUpdate = await ITEM__POSITION_COLL.findByIdAndUpdate(positionID, dataUpdate, { new: true });

                if(!infoAterUpdate) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Remove position
     * Date: 30/02/2022
     */
    remove({ positionsID, userID }) { 
        return new Promise(async resolve => {
            try {
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([...positionsID, userID])) {
                    return resolve({
						error: true,
						message: "Tham số positionsID hoặc userID không hợp lệ",
						keyError: "params_positionsID_or_userID_invalid",
						status: 400
					})
                }

                const listPositions = await ITEM__POSITION_COLL.find({
                    _id: {
                        $in: positionsID
                    }
                }).select('_id').lean();

                if(!listPositions || !listPositions.length) {
                    return resolve({
						error: true,
						message: "Position không tồn tại",
						keyError: "position_not_exists",
						status: 400
					})
                }

                let infoAterRemove = await ITEM__POSITION_COLL.deleteMany({
                    _id: {
                        $in: positionsID
                    },
                    userCreate: userID
                });

                if(!infoAterRemove) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                for (const position of listPositions) {
                    if(position.parent) {
                        await ITEM__POSITION_COLL.findByIdAndUpdate(position.parent, {
                            $pull: {
                                childs: position._id
                            }
                        });
                    }
                }

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: get info position ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ positionID, select, populates }) { 
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
                if(!checkObjectIDs(positionID))
                    return resolve({ error: true, message: 'Request params positionID invalid', status: 400 });
                
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
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterGet = await ITEM__POSITION_COLL.findById(positionID)
                                    .select(select)
                                    .populate(populates)
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    /**
     * Name  : Danh sách position ✅
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {

                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit;
                }
              
                let conditionObj = { 
                    company: companyID
                };

                let sortBy   = { createAt: -1, _id: -1 };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
				
                // POPULATE
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

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__POSITION_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

					let keys	 = ['createAt__-1', '_id__-1'];
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}

                let infoDataAfterGet = await ITEM__POSITION_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
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

                let totalRecord = await ITEM__POSITION_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);
                
                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
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
