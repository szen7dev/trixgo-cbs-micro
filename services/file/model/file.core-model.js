"use strict";
const ObjectID                                  = require('mongoose').Types.ObjectId;

const FILE__CORE_COLL                           = require('../database/file.core-coll');

const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                                = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');
const { 
    FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS
}                                               = require('../helper/file.keys-constant');

class Model extends BaseModel {
    constructor() {
        super(require('../database/file.core-coll'));
    }
    /**
     * 1/ insert (processing)
     * 2/ insert bulk
     * 
     * 3/ update status (success, error)
     * 4/ update status bulk
     * 
     * 6/ get list by status SYSTEM
     * 7/ get info
     * 8/ get list with list fileID with status
     */

    /**
     *   lưu ý:
     *      app: là các name constant
     * */
    insert({ app, name, url, size, userID }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'object_invalid' });

                if (!checkNumberValid({ val: size }))
                    return resolve({ error: true, message: 'size_invalid' });
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                let userCreate = userID;

                let infoAfterInsert = await that.insertData({ app, name, url, size, userCreate });

                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * 
    // cập nhật trạng thái thành công hoặc thất bại
     * @param {*} fileID
     * @param {*} status: chỉ có giá trị FILE_PROCESSING là valid 
     * @returns 
     */
    updateStatus({ fileID, status, userID }) {
        return new Promise(async resolve => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let listStatusForUpdateValid                    = [FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS]; // chỉ có các file_processing -> mới được update
                 /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'object_invalid' });
                if (!checkNumberIsValidWithRange({ arrValid: listStatusForUpdateValid, val: status }))
                    return resolve({ error: true, message: 'status_invalid' });

                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                let fileIsProcessing = await FILE__CORE_COLL.findOne({ _id: fileID, status: FILE_PROCESSING });
                if (!fileIsProcessing)
                    return resolve({ error: true, message: 'file_not_processing' });

                if (fileIsProcessing.userCreate != userID)
                    return resolve({ error: true, message: 'file_not_auth' });

                let infoAfterUpdate = await FILE__CORE_COLL.findByIdAndUpdate(fileID, {
                    status,
                    modifyAt: Date.now()
                }, { new: true })
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: 'cannot_insert' });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfoFile({ fileID, userID }) {
        return new Promise(async resolve => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                 /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(fileID, userID))
                    return resolve({ error: true, message: 'object_invalid' });
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    

                let conditionObj = {
                    userCreate: userID
                };

                let infoFile = await FILE__CORE_COLL.findOne(conditionObj)
                if (!infoFile)
                    return resolve({ error: true, message: 'cannot_get_info' });

                return resolve({ error: false, data: infoFile });
            } catch (error) {
                return resolve({ error: true, message: message });
            }
        })
    }

    getListFileWithStatus({ status='all', userID }) {
        return new Promise(async resolve => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let listStatusValid                             = [FILE_PROCESSING, FILE_UPLOAD_ERROR, FILE_UPLOAD_SUCCESS];
                 /** 
                 * VALIDATION STEP (2)
                 *  - kiểm tra valid từ các input
                 *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if (!checkNumberIsValidWithRange({ arrValid: listStatusValid, val: status }) && status != 'all')
                    return resolve({ error: true, message: 'status_invalid' });
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    

                let conditionObj = {
                    userCreate: userID
                };
                if (status != 'all')
                    conditionObj = {
                        ...conditionObj, status: Number(status)
                    }

                let listFiles = await FILE__CORE_COLL.find(conditionObj).sort({ createAt: -1 });
                if (!listFiles)
                    return resolve({ error: true, message: 'cannot_get_list' });

                return resolve({ error: false, data: listFiles });
            } catch (error) {
                return resolve({ error: true, message: message });
            }
        })
    }
    
}

exports.MODEL = new Model;