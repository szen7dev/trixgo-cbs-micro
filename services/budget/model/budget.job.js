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

/**
 * MODELS
*/


class Model extends BaseModel {

    constructor() {
        super(require('../database/budget.job-coll'))
    }

    
}
exports.MODEL = new Model;
