"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;
 
/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');
 
/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
 
/**
 * COLLECTIONS
 */
const ITEM__CONTRACT_COLL            				= require('../database/item.contract-coll');
 
 
class Model extends BaseModel {
 
    constructor() {
        super(ITEM__CONTRACT_COLL);
    }

    /**
     * Dev: MinhVH
     * Func: Cập nhật hợp đồng theo điều kiện
     * Date: 29/10/2021
     */
    updateContractByCondition({ condition, update }) {
        return new Promise(async (resolve) => {
            try {
            const infoAfterUpdate = await ITEM__CONTRACT_COLL.findOneAndUpdate(condition, update, { new: true })                
                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
 
}
 
exports.MODEL = new Model;