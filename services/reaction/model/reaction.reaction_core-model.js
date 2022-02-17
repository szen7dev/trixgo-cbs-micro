
"use strict";

const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const REACTION__REACTION_CORE_COLL              = require('../database/reaction.reaction_core-coll');

class Model extends BaseModel {

    constructor() {
        super(REACTION__REACTION_CORE_COLL);
    }

    /**
     * Name: Thêm reaction core ✅
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
                dataInsert = { type, userCreate: userID };

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
    update({ reactionCoreID, type }) {
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
                if(!checkObjectIDs(reactionCoreID))
                    return resolve({ error: true, message: "reactionCoreID_invalid" });

                if(!type)
                    return resolve({ error: true, message: "type_invalid" });
                
                /**
                 * LOGIC STEP (3)
                 *  3.1: convert type + update name (ví dụ: string -> number)
                 *  3.2: operation database
                 */    
                dataUpdate = { type };
                
                let infoAfterInsert = await REACTION__REACTION_CORE_COLL.findByIdAndUpdate(reactionCoreID, dataUpdate, { new: true });
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    /**
	 * Dev: MinhVH
	 * Func: DANH SÁCH REACTION BÀI VIẾT
	 */
	getListReaction({ userID, condition, select, populates }) {
		return new Promise(async resolve => {
			try {
                console.log({ userID, condition, select, populates })
				if(!checkObjectIDs([userID])) {
                    return resolve({
						error: true, 
						message: 'Tham số userID không hợp lệ', 
						keyError: 'params_userID_invalid',
						status: 400
					});
				}

				if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Tham số populates không hợp lệ', status: 400 });

					populates = JSON.parse(populates);
				} else{
					populates = {
						path: '',
						select: ''
					}
				}

                const sortBy = {
                    _id: -1,
                    createAt: -1,
                }

				const listReaction = await REACTION__REACTION_CORE_COLL
					.find(condition)
					.select(select)
					.populate(populates)
                    .sort(sortBy)
					.lean();

				const totalRecord = await REACTION__REACTION_CORE_COLL.countDocuments(condition);

				return resolve({
					error: false,
					status: 200,
					data: { 
                        listRecords: listReaction, 
                        totalRecord
                    }
				});
			} catch (error) {
				console.error(error);
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}

}

exports.MODEL = new Model;