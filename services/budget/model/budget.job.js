"use strict";
const BaseModel                             = require('../../../tools/db/base_model');
const ObjectID                              = require('mongoose').Types.ObjectId;
const moment                                = require('moment');
const { _isValid, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany
}                                           = require('../../../tools/utils/utils');


/**
 * DOMAIN AND ACTIONS
*/

/**
 * CONSTANTS
*/
const { CF_DOMAIN_SERVICES } 	= require('../../gateway/helper/domain.constant');
const { VOUCHER_TYPES }         = require('../config/accounting.financial_config');
const { CF_ACTIONS_ITEM }       = require('../../item/helper/item.actions-constant')
/**
 * TOOLS
*/

/**
 * COLLECTIONS
*/
const  BUDGET__BUDGET_JOB_COLL            = require('../database/budget.job-coll')

/**
 * MODELS
*/


class Model extends BaseModel {

    constructor() {
        super(require('../database/budget.job-coll'))
    }

    findDataAndUpdate({ jobId, dataUpdate }){
        return new Promise((resolve)=>{
            try {
                if(!jobId || !_isValid(jobId))
                    return resolve({ errror: true, messsage: 'jobId_invalid' });
                const ressultUpdate = await BUDGET__BUDGET_JOB_COLL.findByIdAndUpdate(jobId, dataUpdate);
                if(!ressultUpdate)
                    return resolve({ errror: true, messsage: 'cant_upadte_budget_jpb' });
                return resolve({ errror: false, messsage: 'successfully_upadte_budget_jpb' });
            } catch (error) {
                console.log(`ERROR [BUDGET][findDataAndUpdate]: ${error} `);
                return resolve({ errror: true, messsage: error });
            }

        });
       
    }
}
exports.MODEL = new Model;
