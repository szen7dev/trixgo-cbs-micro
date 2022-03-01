"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { _isValid }                      = require('../../../tools/utils/utils');
const { KEY_ERROR }                     = require('../../../tools/keys');

const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
/**
 * COLLECTION
 */
const AUTH__COMPANY_COLL                = require('../database/auth.company-coll');

class Model extends BaseModel {

    constructor() {
        super(require('../database/auth.company-coll'));
    }

    insertFast({ name }) {
        return new Promise(async resolve => {
            try {
                let info = await AUTH__COMPANY_COLL.findOne({
                    name: name
                }).select('_id name sign')
                if(info)
                    return resolve({ error: true, message: `Tên/Mã hiệu đã tồn tại: ${info.name}` }); 

                let infoCompanyAfterSave = await this.insertData({
                    name
                });
                if(!infoCompanyAfterSave)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED });

                return resolve({ error: false, data: infoCompanyAfterSave });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    insert({ name, sign, taxid, phone, field, scale, address, slogan, image, supporters, userCreate }) {
        const that = this;
        return new Promise(async (resolve) => {
            try {
                let info = await AUTH__COMPANY_COLL.findOne({
                    $or: [
                        { name: name },
                        { sign: sign },
                    ]
                }).select('_id name sign')
                if(info)
                    return resolve({ error: true, message: `Tên/Mã hiệu đã tồn tại: ${info.name}` }); 

                // if (!checkValidPhoneNumber(phone))
                //     return resolve({ error: true, message: 'phone_not_valid' });

                if(Number.isNaN(Number(field)) || Number.isNaN(Number(scale)))
                    return resolve({ error: true, message: "param_not_valid" });

                // let checkName = await AUTH__COMPANY_COLL.findOne({ name });
                // if(checkName)
                //     return resolve({ error: true, message: "company_existed" });

                let dataInsert = {
                    name, sign, taxid, phone, field, scale, address, slogan, image, userCreate
                }

                if(supporters && supporters.length > 0){
                    dataInsert.supporters = supporters
                }

                let infoCompanyAfterSave = await that.insertData(dataInsert);
                if(!infoCompanyAfterSave)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED });

                return resolve({ error: false, data: infoCompanyAfterSave });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    update({ companyID, name, sign, taxid, phone, field, scale, address, slogan, userUpdate, timeActive, description, website, show, area }) {
        return new Promise(async (resolve) => {
            try {
                if(!sign || !_isValid(companyID) || Number.isNaN(Number(field)) || Number.isNaN(Number(scale)))
                    return resolve({ error: true, message: "param_not_valid" });
              
                let infoCompany = await AUTH__COMPANY_COLL.findById(companyID);
                if(!infoCompany)
                    return resolve({ error: true, message: "company_not_exist" });

                // Kiểm tra tên công ty mới thay đổi đã tồn tại mã hiệu hay không ngoại trừ chính nó.
                let info = await AUTH__COMPANY_COLL.findOne({ 
                    _id: { $ne: companyID },
                    $or: [
                        { name: name },
                        { sign: sign },
                    ] 
                });
                if(info)
                    return resolve({ error: true, message: "company_existed" })

                let dataUpdate = {
                    name, sign, taxid, phone, field, scale, address, slogan, userUpdate, timeActive, description, website, show
                }
                if(area && _isValid(area)){
                    dataUpdate.area = area;
                } 

                let infoCompanyAfterUpdate = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, dataUpdate, { new: true })

                if(!infoCompanyAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoCompanyAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    // Cập nhật thông tin trong phần Quản trị doanh nghiệp
    updateByOwner({ companyID, taxid, phone, email, address, slogan, timeActive, description, intro, website, show  }) {
        return new Promise(async (resolve) => {
            try {              

                let infoCompanyAfterUpdate = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, {
                    taxid, phone, email, address, slogan, timeActive, description, intro, website, show
                }, { new: true })

                if(!infoCompanyAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                return resolve({ error: false, data: infoCompanyAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }   

    // // Cập nhật logo
    // updateImage({ companyID, image }) {
    //     return new Promise(async resolve => {
    //         try {

    //             let infoCompanyImageOld = await AUTH__COMPANY_COLL.findById(companyID);
    //             let { image: ImageOld } = infoCompanyImageOld;

    //             let infoAfterUpdated = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, {
    //                 image, modifyAt: Date.now()
    //             }, { new: true });

    //             // Xóa ảnh củ trên S3 bằng cách push vô file-remove
    //             await FILE_REMOVE_MODEL.insert({ name: ImageOld, path: `files/db/companys/${ImageOld}` });

    //             // pull file hiện tại ra khỏi file-remove
    //             await REMOVE_FILE_COLL.findOneAndDelete({ path: `files/db/companys/${image}`});

    //             return resolve({ error: false, data: infoAfterUpdated });

    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    // // Cập nhật ảnh bìa
    // updateCover({ companyID, cover }) {
    //     return new Promise(async resolve => {
    //         try {

    //             let infoCompanyImageOld = await AUTH__COMPANY_COLL.findById(companyID);
    //             let { cover: coverOld } = infoCompanyImageOld;

    //             let infoAfterUpdated = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, {
    //                 cover, modifyAt: Date.now()
    //             }, { new: true });

    //             // Xóa ảnh củ trên S3 bằng cách push vô file-remove
    //             await FILE_REMOVE_MODEL.insert({ name: coverOld, path: `files/db/companys/${coverOld}` });

    //             // pull file hiện tại ra khỏi file-remove
    //             await REMOVE_FILE_COLL.findOneAndDelete({ path: `files/db/companys/${image}`});

    //             return resolve({ error: false, data: infoAfterUpdated });

    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    // // Cập nhật cho user làm Supporter cho công ty
    // // Tính năng sử dụng: Supporter
    // // Author: HiepNH
    // updateGrantAccessSuppoter({ companyID, userID, valRead }) {
    //     return new Promise(async (resolve) => {
    //         try {              
    //             if(Number(valRead) === 1){
    //                 let infoCompanyAfterUpdate = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, {
    //                     $addToSet: { supporters: userID } 
    //                 }, { new: true })
    
    //                 if(!infoCompanyAfterUpdate)
    //                     return resolve({ error: true, message: "cannot_update" });
    
    //                 return resolve({ error: false, data: infoCompanyAfterUpdate });
    //             }else{
    //                 let infoCompanyAfterUpdate = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, {
    //                     $pull: { supporters: userID } 
    //                 }, { new: true })
    
    //                 if(!infoCompanyAfterUpdate)
    //                     return resolve({ error: true, message: "cannot_update" });
    
    //                 return resolve({ error: false, data: infoCompanyAfterUpdate });
    //             }
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }  

    // // Cập nhật cho user ở công ty khác vào xem báo cáo quản trị tài chính của công ty mình
    // // Tính năng sử dụng: Báo cáo quản trị (FINANCIAL)
    // // Author: HiepNH
    // updateGrantAccessAdreport({ companyID, linkUserID, valRead }) {
    //     return new Promise(async (resolve) => {
    //         try {              
    //             if(Number(valRead) === 1){
    //                 let infoCompanyAfterUpdate = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, {
    //                     $addToSet: { adreport: linkUserID } 
    //                 }, { new: true })
    
    //                 if(!infoCompanyAfterUpdate)
    //                     return resolve({ error: true, message: "cannot_update" });
    
    //                 return resolve({ error: false, data: infoCompanyAfterUpdate });
    //             }else{
    //                 let infoCompanyAfterUpdate = await AUTH__COMPANY_COLL.findByIdAndUpdate(companyID, {
    //                     $pull: { adreport: linkUserID } 
    //                 }, { new: true })
    
    //                 if(!infoCompanyAfterUpdate)
    //                     return resolve({ error: true, message: "cannot_update" });
    
    //                 return resolve({ error: false, data: infoCompanyAfterUpdate });
    //             }
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }   

    getInfo({ companyID }) {
        return new Promise(async resolve => {
            try {
                let info = await AUTH__COMPANY_COLL.findById(companyID).populate({
                    path  : 'area',
                    select: '_id name',
                    populate: {
                        path  : 'parent',
                        select: '_id name',
                        populate: {
                            path  : 'parent',
                            select: '_id name',
                        }
                    }
                });
                if(!info)
                    return resolve({ error: true, message: "cannot_get_info" });

                return resolve({ error: false, data: info })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    getList({ show }){
        return new Promise(async (resolve) => {
            try {
                let conditionObj;
                if(!show){
                    conditionObj = { }
                }else{
                    conditionObj = { show: show }
                }
                let listData = await AUTH__COMPANY_COLL.find(conditionObj).select("_id name sign address slogan description image timeActive createAt").sort({createAt: 1})
                if(!listData)
                    return resolve({ error: true, message: "cannot_get_list" });
                    
                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // getListWithKey({ key, show }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             let conditionObj;

    //             if(key && key.length > 0){
    //                 let keyword = key.split(" ");
    //                 keyword = '.*' + keyword.join(".*") + '.*';

    //                 if(!show){
    //                     conditionObj = {
    //                         $or: [
    //                             { description:  new RegExp(keyword, 'i') },
    //                             { name:  new RegExp(keyword, 'i') },
    //                             { sign:  new RegExp(keyword, 'i') },
    //                         ]
    //                     }
    //                 }else{
    //                     conditionObj = {
    //                         show: show,
    //                         $or: [
    //                             { description:  new RegExp(keyword, 'i') },
    //                             { name:  new RegExp(keyword, 'i') },
    //                             { sign:  new RegExp(keyword, 'i') },
    //                         ]
    //                     }
    //                 }
    //             }

    //             let listData = await AUTH__COMPANY_COLL.find(conditionObj).select("_id name sign address slogan description image timeActive").sort({timeActive: 1})
    //             if(!listData)
    //                 return resolve({ error: true, message: "cannot_get_list" });
                    
    //             return resolve({ error: false, data: listData });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    /**
     *  KHU VỰC NÀY ĐỆ VIẾT THEO CÁCH MỚI 
     *  Date: 20/12/2021
     */

    /**
     * Name: get info company ✅
     * Author: Depv
     * Date: 20/12/2021
     */
    getInfoV2({ companyID, select, populates={} }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'param_invalid' });
                
                 // populate
                 if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path  : "",
                        select: ""
                    }
                }
            
                let infoCompany = await AUTH__COMPANY_COLL.findById(companyID)
                    .select(select)
                    .populate(populates)

                if (!infoCompany) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: infoCompany });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name  : Danh sách company ✅
     * Author: Depv
     * Code  : 20/12/2021
     */
    getListV2({ 
        userID, 
        keyword, limit = 10, lastestID, select, populates={} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {
                };
                let conditionObjOrg = {
                };
                
                let conditionFind = {};
                let sortBy   = { createAt: -1 };
                let objSort  = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
             
                // populate
                if(populates && typeof populates === 'string'){
                    if(!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                }else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.$or  = [
                        { name: new RegExp(keyword, 'i') },
                        { sign: new RegExp(keyword, 'i') },
                        { phone: new RegExp(keyword, 'i') },
                    ]
                }

                conditionObjOrg = { ...conditionObj };
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                // GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await AUTH__COMPANY_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
                    let keys	 = ['createAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    
                    conditionFind = dataPagingAndSort.data.find;
                    sortBy = dataPagingAndSort.data.sort;

                    if(conditionObj.$or){
                        conditionObj.$and = [
                            { $or: conditionObj.$or },
                            { $or: conditionFind.$or },
                        ]
                        delete conditionObj.$or;
                        delete conditionFind.$or;
                    }
                }

                let infoDataAfterGet = await AUTH__COMPANY_COLL.find({ ...conditionObj, ...conditionFind })
                    .select(select)
                    .limit(+limit+1)
                    .populate(populates)
                    .sort(sortBy) 
                    .lean(); 
                
                    if(!infoDataAfterGet)
                      return resolve({ error: true, message: "Can't get data", status: 403 });

                    let nextCursor	= null;
                    if(infoDataAfterGet && infoDataAfterGet.length){
                        if(infoDataAfterGet.length > limit){
                            nextCursor = infoDataAfterGet[limit - 1]._id;
                            infoDataAfterGet.length = limit;
                        }
                    }
    
                    let totalRecord = await AUTH__COMPANY_COLL.count(conditionObjOrg);
                    let totalPage   = Math.ceil(totalRecord/limit);
                    return resolve({ error: false, data: {
                        listRecords: infoDataAfterGet,
                        limit: +limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                    }, status: 200 });
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;