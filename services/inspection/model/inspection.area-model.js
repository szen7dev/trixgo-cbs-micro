"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
/**
 * import inter-coll, exter-coll
 */
 const INSPECTION__AREA_COLL                 = require('../database/inspection.area-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
 class Model extends BaseModel {

    constructor() {
        super(INSPECTION__AREA_COLL);
    }

    // Thêm mẩu tin: HiepNH ✅
    insert({ name, sign, description, userCreate }) { 
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
                if(!checkObjectIDs(userCreate))
                    return resolve({ error: true, message: 'Request params userCreate invalid', status: 400 });

                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                if (!sign || sign == '')
                    return resolve({ error: true, message: 'sign_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                 let infoDataAfterInserted = await this.insertData({ 
					name, 
					sign, 
					description, 
					userCreate,
				});
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create conversation", status: 403 });


                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

 }

 exports.MODEL = new Model;