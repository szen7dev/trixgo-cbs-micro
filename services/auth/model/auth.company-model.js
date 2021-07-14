"use strict";
const BaseModel                         = require('../../../tools/db/base_model');

const { _isValid }                      = require('../../../tools/utils/utils');
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
                    return resolve({ error: true, message: "cannot_insert" });

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
                    return resolve({ error: true, message: "cannot_insert" });

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
                    return resolve({ error: true, message: "cannot_update" });

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
}

exports.MODEL = new Model;