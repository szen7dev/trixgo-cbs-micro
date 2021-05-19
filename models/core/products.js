"use strict";
const BaseModel             = require('../intalize/base_model');
const ObjectID              = require('mongoose').Types.ObjectId;
const PRODUCT_COLL          = require('../../database/test/products_coll')
const   
{ 
    CF_ACTIONS,
    CF_ACTIONS_CATEGORIES,
}    				        = require('../../config/constants/actions');
// const redis                 = require("redis");
// const client                = redis.createClient();
class Model extends BaseModel {

    constructor() {
        super(require('../../database/test/products_coll'))
    }

    async getList(){
        return new Promise(async resolve => {
            try {
                let listProducts = await PRODUCT_COLL.find({})
                    // .populate({
                    //     path: 'category',
                    //     select:'name',
                    // });
                return resolve({ error: false, message: 'get_list_products_success', data: { product: listProducts } });
            } catch (error) {
                resolve({ error: true, message: error.message });
            }
        });
    }

    create({ctx, name, price, decription, categoryID, authorID}) {
        return new Promise(async resolve => {
            try {
               
                //CHECK COMPLETED ALL FIELDS
                if (!name || !price || !decription || !categoryID, !authorID) {
                    return resolve({ error: true, message: 'have_not_completed', data: [] });
                }

                // call service category for get info category

                let infoCategory= await ctx.call(`${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.FIND_BY_ID}`, {categoryID: categoryID})
                if(!infoCategory || infoCategory.error){
                    return resolve({ error: true, message: infoCategory.message ? infoCategory.message : 'not_found_category', data: [] });
                }

                let isExistProduct = await PRODUCT_COLL.findOne({
                    name
                });
                
                //CHECK EMAIL ALREADY EXIST
                if (isExistProduct)
                    return resolve({ error: true, message: 'products_exists', data: [] });

                let createNewProduct = await new PRODUCT_COLL({ name, price, decription, category : infoCategory.data._id, author: authorID });

                // call server category and put product into this   
                let addProductInCategory = await ctx.call(`${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.ADD_PRODUCT}`, {
                    "productID": createNewProduct._id.toString(), "categoryID": infoCategory.data._id.toString()
                })
                if( !addProductInCategory || addProductInCategory.error){
                    return resolve({ error: true, message: addProductInCategory.message ? addProductInCategory.message : 'cannot_add_product_into_category' })
                }

                let infoProductAfterInsert = await createNewProduct.save();

                if (!infoProductAfterInsert) {
                    return resolve({ error: true, message: 'cannot_insert_product', data: [] });
                }

                return resolve({ error: false, message: 'insert_success', data: { product: createNewProduct } });
            } catch (error) {
                resolve({ error: true, message: error.message });
            }
        });
    };

    async findById({productID}) {
        return new Promise(async resolve => {
            try {

                let infoProduct = await PRODUCT_COLL.findById(productID)
                    .populate({
                        path: 'category',
                        select:'name',
                    });
                if(!infoProduct){
                    return resolve({error: true, message:'not_found_product'});
                }
                return resolve({ error: false, message: 'get_info_products_success', data: { product: infoProduct } });
            } catch (error) {
                resolve({ error: true, message: error.message });
            }
        });
    }

    async remove({ctx, id, categoryID}){
        return new Promise(async resolve => {
            try {
                let listProductForRemove = await PRODUCT_COLL.findByIdAndDelete(id);
                if(!listProductForRemove){
                    return resolve({ error: true, message: 'product_not_found', data: [] });
                }
                let listCategoryForRemove = await ctx.call(`${CF_ACTIONS.CATEGORIES}.${CF_ACTIONS_CATEGORIES.UPDATE}`, {categoryID: categoryID, productID: id})
              
                if (!listProductForRemove || !listCategoryForRemove || listCategoryForRemove.error) {
                    return resolve({ error: true, message: listCategoryForRemove ? listCategoryForRemove.message : 'remove_faild' });
                }
                return resolve({error: false, message:'remove_success'});	
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

    async removeFromCate({categoryID}){
        return new Promise(async resolve => {
            try {
                let listProductForRemove = await PRODUCT_COLL.deleteMany({category: categoryID});
                if (!listProductForRemove || listProductForRemove.deletedCount === 0) {
                    return resolve({ error: true, message: 'remove_faild' });
                }
                return resolve({error: false, message:'remove_success'});	
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

    async addToCart({productID}){
        return new Promise(async resolve => {
            try {
                if(!productID)
                    return resolve({ error: true, message: 'not_found_product' });
                let findProduct = await PRODUCT_COLL.findById(productID, {_id : 1,name: 1,price: 1})

                if (!findProduct) {
                    return resolve({ error: true, message: 'not_found_product' });
                }
                return resolve({error: false, message:'add_to_cart_success', data: findProduct});	
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

    async showCart(nameCart){
        return new Promise(async resolve => {
            try {
                await client.smembers(nameCart, function(err, reply){
                    let data = []
                    if(err){
                        throw new MoleculerClientError("Menu invalid!", 404, "Menu_EXISTED");
                    } else {
                        reply.forEach(product => {
                            data.push(JSON.parse(product))
                        });
                        return resolve({ error: false, message: 'get_cart_success', data });
                    }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, data: [] });
            }
        })
    }

}

exports.MODEL = new Model;