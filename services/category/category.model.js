"use strict";
const BaseModel             = require('../../database/base_model');
const ObjectID              = require('mongoose').Types.ObjectId;
const CATEGORY_COLL         = require('../../database/test/category_coll')
const 
{   CF_ACTIONS, 
    CF_ACTIONS_PRODUCTS
}                           = require('../../config/constants/actions');
class Model extends BaseModel {

    constructor() {
        super(require('../../database/test/account_coll'))
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

    async update({categoryID, productID}){
        return new Promise(async resolve => {
            try {
                let listCategoryForRemove = await CATEGORY_COLL.findByIdAndUpdate(categoryID,{
                    $pull: {
                        products: productID
                    }
                })
                if (!listCategoryForRemove) {
                    return resolve({ error: true, message: 'update_faild' });
                } 
                return resolve({ error: false, message: 'update_success', data: listCategoryForRemove });
                
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

    async create({name, authorID}){
        return new Promise(async resolve => {
            try {
                //CHECK COMPLETED ALL FIELDS
                if (!name || !authorID) {
                    return resolve({ error: true, message: 'have_not_completed_name', data: [] });
                }

                let isExistCategory = await CATEGORY_COLL.findOne({
                    name
                });
                //CHECK EMAIL ALREADY EXIST
                if (isExistCategory)
                    return resolve({ error: true, message: 'category_exists', data: [] });

                
                let createNewCategoryTemp = new CATEGORY_COLL({ name, author: authorID });
                let createNewCategory = await createNewCategoryTemp.save();
        
                if (!createNewCategory) {
                    return resolve({ error: true, message: 'cannot_insert_category', data: [] });
                }
                return resolve({ error: false, message: 'insert_success', data: { category: createNewCategory } });
            } catch (error) {
                resolve({ error: true, message: error.message });
            }
        });
    }

    async addProduct({productID, categoryID}){
        return new Promise(async resolve => {
            try {
                //CHECK COMPLETED ALL FIELDS
                if (!productID || !categoryID) {
                    return resolve({ error: true, message: 'have_not_completed_name', data: [] });
                }

                let infoCategoryAfterUpdate = await CATEGORY_COLL.findByIdAndUpdate(categoryID, {
                    $addToSet: {
                        products: productID
                    }
                });

                if(!infoCategoryAfterUpdate)
                    return resolve({error: true, message: 'cannot_add_product_into_category'});
                return resolve({ error: false, message: 'add_product_into_category_success', data: { category: infoCategoryAfterUpdate } });
            } catch (error) {
                resolve({ error: true, message: error.message });
            }
        });
    }

    async remove({ctx, id}){
        return new Promise(async resolve => {
            try {
                let categoryForRemove = await CATEGORY_COLL.findByIdAndDelete(id);
                
                let listProductForRemove = await ctx.call(`${CF_ACTIONS.PRODUCTS}.${CF_ACTIONS_PRODUCTS.REMOVE_FROM_CATE}`, {categoryID: id})
                if (!categoryForRemove || !listProductForRemove || listProductForRemove.error) {
                    return resolve({ error: true, message: listProductForRemove ? listProductForRemove.message : 'remove_faild' });
                }
                return resolve({error: false, message:'remove_success'});	
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }
}

exports.MODEL = new Model;