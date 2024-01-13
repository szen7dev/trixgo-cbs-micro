"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')
const { hash, compare }                 = require('../../../tools/bcrypt');

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
 */
const USER_COLL                         = require('../../auth/database/auth.user-coll')
const ANALYSIS__HISTORY_DATA_COLL       = require('../database/analysis.history_data-coll')

class Model extends BaseModel {

    constructor() {
        super(ANALYSIS__HISTORY_DATA_COLL)
    }

	/**
	 * Dev: Depv
	 * Func: Tạo history traffic
	 * Date: 13/12/2021
	 */
	insert({ type, userCreate }){
        // console.log({ type, userCreate })
        return new Promise(async resolve => { 
            try {
                let dataInsert = { userCreate}; 
                if(type){
                    dataInsert.type = type;
                }
                let infoAfterInsert = await this.insertData(dataInsert);
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getData({ option, companyID, page, unit, getNumber, newPassword }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                return resolve({ error: false, data: 'Get data thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    convertData({ option, companyID, page, unit, getNumber, newPassword }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                return resolve({ error: false, data: 'Convert thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    resetData({ option, companyID, page, unit, getNumber, newPassword }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                if(option == 1){
                    return resolve({ error: false, data: 'Reset thành công' });
                }else if(option == 2){
                    if(companyID && checkObjectIDs(companyID)){
                        const newPassHash = await hash(newPassword, 8)
                        await USER_COLL.updateMany({company: companyID},{$set: {password: newPassHash}})
                        return resolve({ error: false, data: 'Reset thành công' })
                    }else{
                        return resolve({ error: false, data: 'Reset thất bại' })
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    exportExcel({ option, companyID, page, unit, getNumber, newPassword }){
        // console.log({ option, companyID, page, unit, getNumber, newPassword })
        return new Promise(async resolve => { 
            try {
                return resolve({ error: false, data: 'Export excel thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model