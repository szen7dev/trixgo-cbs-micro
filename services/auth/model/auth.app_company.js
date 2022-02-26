"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, objectID }                        
                                        = require('../../../tools/utils/utils');

/**s
 * import inter-coll, exter-coll
 */
const AUTH__APP_COMPANY_COLL                = require('../database/permission/auth.app_company-coll');
const AUTH__APP_USER_COLL                   = require('../database/permission/auth.app_user-coll');
const { RANGE_BASE_PAGINATION_V2 } 	        = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {              

    constructor() {
        super(AUTH__APP_COMPANY_COLL);
    }
    
    /**
     * Name  : Thêm mẩu tin
     * - A Hiệp: lưu ý 1 company và 1 app chỉ tồn tại 1 mẩu tin duy nhất
     * - Khi cập nhật thông tin của app_company => cũng phải cập nhật app_user theo trường endTime
     * Author: Depv
     * Code  : 
     */

    /**
     * Name  : update app company ✅
     * Author: Depv
     * Code  : 
     */
    update({ appCompanyID, maxCount, maxData, startTime, endTime, userID }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(appCompanyID))
                    return resolve({ error: true, message: "Mã appCompanyID không hợp lệ", keyError: "appCompanyID_invalid", status: 403 });
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                if(maxCount){
                    dataUpdate.maxCount = maxCount;
                }

                if(maxData){
                    dataUpdate.maxData = maxData;
                }

                if(startTime){
                    dataUpdate.startTime = startTime;
                }

                if(endTime){
                    dataUpdate.endTime = endTime;
                }
                
                let infoAterUpdate = await AUTH__APP_COMPANY_COLL.findByIdAndUpdate(appCompanyID, dataUpdate);
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "cannot_update", status: 403 });

                if(endTime){
                    if(infoAterUpdate.endTime.getTime() != (new Date(endTime)).getTime()){
                        let app     = infoAterUpdate.app;
                        let company = infoAterUpdate.company;
                        //Cập nhật endTime cho App_User
                        await AUTH__APP_USER_COLL.updateMany({ app, company }, { $set: { endTime }});
                    }
                }

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;