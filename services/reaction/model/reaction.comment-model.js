
"use strict";
const ObjectID                                  = require('mongoose').Types.ObjectId;
const REACTION__COMMENT_COLL                    = require('../database/reaction.comment-coll');
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                                = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
 
class Model extends BaseModel {
    constructor() {
        super(REACTION__COMMENT_COLL);
    }
    /**
     * Name: Thêm comment
     * Author: Depv
     * Code: F0271
     */
    insert({ content, userID }) {
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

                dataInsert.content = content;
                dataInsert.author = userID;

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
     * Name: Sửa comment
     * Author: Depv
     * Code: F0272
     */
    update({ commentID, content }) {
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
                if(!checkObjectIDs(commentID))
                    return resolve({ error: true, message: "Request params commentID invalid" });

                if(!content)
                    return resolve({ error: true, message: "Request params content invalid" });

               /**
                * LOGIC STEP (3)
                *  3.1: convert type + update name (ví dụ: string -> number)
                *  3.2: operation database
                */    
                dataUpdate.content = content;
                let infoAfterAction = await REACTION__COMMENT_COLL.findByIdAndUpdate(commentID, dataUpdate, { new: true });
                if(!infoAfterAction)
                    return resolve({ error: true, message: 'cannot_update' });

                return resolve({ error: false, data: infoAfterAction});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
       })
    }
}
exports.MODEL = new Model;