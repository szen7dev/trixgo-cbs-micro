
"use strict";
const ObjectID                                  = require('mongoose').Types.ObjectId;
const REACTION__COMMENT_FILE_CORE_COLL          = require('../database/reaction.comment_file_core-coll.js');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                                = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');

class Model extends BaseModel {
    constructor() {
        super(REACTION__COMMENT_FILE_CORE_COLL);
    }
    /**
     * Name: Thêm comment
     * Author: Depv
     * Code: F0271
     */
    insert({ comment, fileCore }) {
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
                if(!checkObjectIDs(comment))
                  return resolve({ error: true, message: "Request params comment invalid" });

                if(!checkObjectIDs(fileCore))
                    return resolve({ error: true, message: "Request params fileCore invalid" })
                
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */
                dataInsert = { comment, file: fileCore };
                let infoAfterInsert = await that.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}
exports.MODEL = new Model;