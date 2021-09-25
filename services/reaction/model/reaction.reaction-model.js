
"use strict";
const ObjectID                                  = require('mongoose').Types.ObjectId;
const REACTION__COMMENT_COLL                    = require('../database/reaction.comment-coll');
const REACTION__REACTION_COLL                   = require('../database/reaction.reaction-coll');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                                = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 						= require('../../file/helper/file.actions-constant');

// Lưu ý reaction core chỉ có 2 hàm thêm và vập nhật, xóa và lấy danh sách thì được lấy thông qua reaction theo ứng dụng
class Model extends BaseModel {
    constructor() {
        super(REACTION__REACTION_COLL);
    }
    /**
     * Name: Thêm reaction ✅
     * Author: Depv
     * Code: F0275
     */
    insert({ type, userID }) {
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
                    return resolve({ error: true, message: "author_invalid" });

                if(!type)
                    return resolve({ error: true, message: "type_invalid" });
                
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                dataInsert = { type, author: userID };

                let infoAfterInsert = await that.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    /**
     * Name: Cập nhật type reaction ✅
     * Author: Depv
     * Code: F0276
     */
    update({ reactionID, type }) {
        const that = this;
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
                if(!checkObjectIDs(reactionID))
                    return resolve({ error: true, message: "reactionID_invalid" });

                if(!type)
                    return resolve({ error: true, message: "type_invalid" });
                
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                dataUpdate = { type };
                
                let infoAfterInsert = await REACTION__COMMENT_COLL.findByIdAndUpdate(reactionID, dataUpdate, { new: true });
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

}
exports.MODEL = new Model;