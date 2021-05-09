// import CATEGORY_COLL from '../../database/test/category_coll';


// let PRODUCTS_MODEL    		= require('../../models/core/products').MODEL;
// let { CF_HANDLER_ACCOUNT }  = require('../../config/constants/actions/handler/account');
// let { CF_EVENT_ACCOUNT } 	= require('../../config/constants/events');
// let PRODUCT_COLL = require('../../database/test/products_coll')
// let CATEGORY_COLL = require('../../database/test/products_coll')
// module.exports = {
//     create: {
//         async handler(ctx){
//             return new Promise(async resolve => {
//                 try {
//                     let { name, price, decription, category } = ctx.params;
//                     //CHECK COMPLETED ALL FIELDS
//                     if (!name || !price || !decription || !category) {
//                         return resolve({ error: true, message: 'have_not_completed', data: [] });
//                     }

//                     let isExistProduct = await PRODUCT_COLL.findOne({
//                         name
//                     });
//                     //CHECK EMAIL ALREADY EXIST
//                     if (isExistProduct)
//                         return resolve({ error: true, message: 'products_exists', data: [] });

//                     let createNewProduct = new PRODUCT_COLL({ name, price, decription, category });
//                     let infoProductAfterInsert = await createNewProduct.save();

//                     if (!infoProductAfterInsert) {
//                         return resolve({ error: true, message: 'cannot_insert_product', data: [] });
//                     }

//                     let { _id: productID } = infoProductAfterInsert;

//                     let infoCategoryAfterUpdate = await CATEGORY_COLL.findByIdAndUpdate(category, {
//                         $addToSet: {
//                             products: productID
//                         }
//                     });

//                     if(!infoCategoryAfterUpdate)
//                         return resolve({error: true, message: 'cannot_update_category'});
//                     return resolve({ error: false, message: 'insert_success', data: { product: createNewProduct } });
//                 } catch (error) {
//                     resolve({ error: true, message: error.message });
//                 }
//             });
//         }
//     },

//     getList: {
//         async handler(ctx){
//             return new Promise(async resolve => {
//                 try {

//                     let listProducts = await PRODUCT_COLL.find({})
//                         .populate({
//                             path: 'category',
//                             select:'name',
//                         });
//                     return resolve({ error: false, message: 'get_list_products_success', data: { product: listProducts } });
//                 } catch (error) {
//                     resolve({ error: true, message: error.message });
//                 }
//             });
//         }
//     },

//     findById: {
//         params:{
//             id: { type: "string" }
//         },
//         async handler(ctx) {
//             return new Promise(async resolve => {
//                 try {
//                     let id = ctx.params.id;

//                     let infoProduct = await PRODUCT_COLL.findById(id)
//                         .populate({
//                             path: 'category',
//                             select:'name',
//                         });
//                     if(!infoProduct){
//                         return resolve({error: true, message:'not_found_product'});
//                     }
//                     return resolve({ error: false, message: 'get_info_products_success', data: { product: infoProduct } });
//                 } catch (error) {
//                     resolve({ error: true, message: error.message });
//                 }
//             });
//         }
//     },

//     remove: {
//         params:{
//             id: { type: "string" },
//             categoryId: { type: "string" },
//         },
//         async handler(ctx){
//             return new Promise(async resolve => {
//                 try {
//                     let { id, categoryId } = ctx.params;
//                     let listProductForRemove = await PRODUCT_COLL.findByIdAndDelete(id);
//                     let listCategoryForRemove = await CATEGORY_COLL.findByIdAndUpdate(categoryId,{
//                         $pull: {
//                             products: id
//                         }
//                     })
//                     if (!listProductForRemove || !listCategoryForRemove) {
//                         return resolve({ error: true, message: 'remove_success_faild' });
//                     }
//                     return resolve({error: false, message:'remove_success'});	
//                 } catch (error) {
//                     return resolve({ error: true, message: error.message, data: [] });
//                 }
//             })
//         }
//     },
    
// } 
