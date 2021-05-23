"use strict";
const BaseModel             = require('../../tools/db/base_model');
const CATEGORY_COLL         = require('./database/example.abc-coll');

class Model extends BaseModel {

    constructor() {
        super(require('./database/example.abc-coll'))
    }

    async getList(ctx){
        return new Promise(async resolve => {
            try {
                let listCategories = await CATEGORY_COLL.find({})
                .populate({
                    path: 'author',
                    select: 'fullName'
                })
                // let listCategoriesDe = await ACCOUNT_COLL.removeMany({firstName: "Thomas"});
                // console.log(listCategoriesDe);
                if (!listCategories) {
                    return resolve({ error: true, message: 'cannot_get_listCategories',  data: listCategories });
                }
                return resolve({ error: false, message: 'get_list_categories_success', data: listCategories });
                // ChildRouter.responseSuccess({ ctx, error: false, message: 'get_list_user_success', data: listUser })
                    
                
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

    async findById({categoryID}){
        return new Promise(async resolve => {
            try {
                let infoCategory = await CATEGORY_COLL.findById(categoryID)
                
                if (!infoCategory) {
                    return resolve({ error: true, message: 'cannot_get_infoCategory',  data: infoCategory });
                }
                return resolve({ error: false, message: 'get_category_success', data: infoCategory });
                // ChildRouter.responseSuccess({ ctx, error: false, message: 'get_list_user_success', data: listUser })
                    
                
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }
}

exports.MODEL = new Model;