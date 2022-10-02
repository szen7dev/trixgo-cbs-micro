"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const moment                            =  require("moment");
const { RANGE_BASE_PAGINATION } 		   = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-coll, exter-coll
 */
const AUTH__USER_COLL                      = require('../../auth/database/auth.user-coll');
const ITEM__CONTRACT_COLL                  = require('../../item/database/item.contract-coll');
const INSPECTION__DOC_COLL                 = require('../database/inspection.doc-coll');
const INSPECTION__AREA_COLL                = require('../database/inspection.area-coll');
const INSPECTION__GROUP_COLL               = require('../database/inspection.group-coll');
const INSPECTION__AREA_GROUP_COLL          = require('../database/inspection.area_group-coll');

/**
 * import inter-model, exter-model
 */
 const INSPECTION__CHECKLIST_MODEL          = require('./inspection.checklist-model').MODEL;
 const INSPECTION__AREA_GROUP_MODEL         = require('./inspection.area_group-model').MODEL;

/**
 * import util files
 */

class Model extends BaseModel {
    
    constructor() {
        super(INSPECTION__DOC_COLL);
        this.STATUS_DONE = 4;
    }
    
    /**
     * Name: Thêm
     * Author: HiepNH
     * Code: 2/10/2022
     */
    insert({ contractID, areaID, groupID, sign, templateID, assigneeID, members, name, expiredTime, description, userID }) { 
        // console.log({ contractID, areaID, groupID, sign, templateID, assigneeID, members, name, expiredTime, description, userID })
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Tạo biên bản (kiểm tra, nghiệm thu)
                 * 2-Cập nhật % hoàn thành/trạng thái cho Khu vực-Nhóm công tác
                 */
                let dataInsert = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(contractID) || !checkObjectIDs(areaID) || !checkObjectIDs(groupID) || !checkObjectIDs(assigneeID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params contractID|areaID|groupID|assigneeID|userID invalid', status: 400 })

                let infoContract        = await ITEM__CONTRACT_COLL.findById(contractID).select('_id name project company')
                let infoArea            = await INSPECTION__AREA_COLL.findById(areaID).select('_id name parent')
                let infoGroup           = await INSPECTION__GROUP_COLL.findById(groupID).select('_id name parent')
                let infoAssignee        = await AUTH__USER_COLL.findById(assigneeID).select('_id fullname company')
                let infoAuthor          = await AUTH__USER_COLL.findById(assigneeID).select('_id fullname company')
                // console.log(infoContract)
                // console.log(infoArea)
                // console.log(infoGroup)
                // console.log(infoAssignee)
                // console.log(infoAuthor)
            
                    
                dataInsert = { 
                    project: infoContract.project, 
                    contract: contractID, 
                    area: areaID, 
                    parentArea: infoArea.parent, 
                    group: groupID, 
                    parentGroup: infoGroup.parent, 
                    name, 
                    expiredTime, 
                    author: userID, 
                    companyOfAuthor: infoAuthor.company,
                    assignee: assigneeID, 
                    companyOfAssignee: infoAssignee.company
                };

                if(templateID && !checkObjectIDs(templateID)){
                    dataInsert.template = templateID;
                }

                if(members && !checkObjectIDs(members)){
                    dataInsert.members = members;
                }

                if(sign && sign != ""){
                    // let checkSign = await INSPECTION__DOC_COLL.findOne({ sign, contract: contractID });
                    // if(checkSign)
                    //     return resolve({ error: true, message: 'Sign existed', status: 400 });
                    dataInsert.sign = sign;
                }

                if(description){
                    dataInsert.description = description;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert);
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create inspection doc", status: 403 });
            
                // // Tiến hành thêm checklist từ tempalte checklist
                // let listTemplateChecklist = await INSPECTION__TEMPLATE_CHECKLIST_COLL.find({ inspection: templateID });
                // if(listTemplateChecklist.length){
                //     for (const templateChecklist of listTemplateChecklist) {
                //         let { name } = templateChecklist;
                //         let infoChecklistAfterInsert = await INSPECTION__CHECKLIST_MODEL.insert({
                //             inspection: infoDataAfterInserted._id, template, name, authorID: userID
                //         })
                //     }
                // }

                /**
                 * CẬP NHẬT TRẠNG THÁI CHO NHÓM CÔNG TÁC-KHU VỰC (cần kiểm tra lại cho kỹ)
                 * 1-Nhóm cha-Khu vực cha (Hoàn thiện-Tầng 1)
                 * 2-Nhóm cha-Khu vực con (Hoàn thiện-Căn hộ C1.T1)
                 * 3-Nhóm con-Khu vực con (Công tác xây-Căn hộ C1.T1)
                 */
                let infoG1A1 = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID: infoArea.parent, groupID: infoGroup.parent, userID })
                let infoG1A2 = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID, groupID: infoGroup.parent, userID })
                let infoG2A2 = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID, groupID, userID })
                
                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Cập nhật
     * Author: HiepNH
     * Code: 2/10/2022
     */
    update({ docID, sign, templateID, assigneeID, name, expiredTime, description, status, members, userID }) { 
        return new Promise(async (resolve) => {
            try {
                let infoDoc = await INSPECTION__DOC_COLL.findById(docID)

                const { area: areaID, group: groupID } = infoDoc

                let infoArea            = await INSPECTION__AREA_COLL.findById(areaID).select('_id name parent')
                let infoGroup           = await INSPECTION__GROUP_COLL.findById(groupID).select('_id name parent')
                // let infoAssignee        = await AUTH__USER_COLL.findById(assigneeID).select('_id fullname company')

                let dataUpdate = { userUpdate: userID, modifyAt: Date.now()};

                /** 
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                if(checkObjectIDs(userID)){
                    dataUpdate.userUpdate = userID;
                }

                /**
                 * Cập nhật template
                 * ->Xóa checklist cũ
                 * ->Cập nhật checklist mới
                 */
                if(checkObjectIDs(templateID)){
                    dataUpdate.template = templateID;
                }

                if(name && name != ""){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(checkObjectIDs(members)){
                    dataUpdate.$addToSet = {
                        members: members
                    }
                }

                if(expiredTime){
                    dataUpdate.expiredTime = expiredTime;
                }

                if(description){
                    dataUpdate.description = description;
                }

                /**
                 * Nếu cập nhật về trạng thái hoàn thành
                 */
                if(status == this.STATUS_DONE){
                    dataUpdate.status = this.STATUS_DONE;
                    dataUpdate.finishedTime = new Date(); // Ngày hoàn thành thực tế
                }else{
                    dataUpdate.status = Number(status)
                }

                let infoDataAfterUpdate = await INSPECTION__DOC_COLL.findByIdAndUpdate(docID, dataUpdate, { new: true });
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update docs", status: 403 });

                /**
                 * CẬP NHẬT TRẠNG THÁI CHO NHÓM CÔNG TÁC-KHU VỰC (cần kiểm tra lại cho kỹ)
                 * 1-Nhóm cha-Khu vực cha (Hoàn thiện-Tầng 1)
                 * 2-Nhóm cha-Khu vực con (Hoàn thiện-Căn hộ C1.T1)
                 * 3-Nhóm con-Khu vực con (Công tác xây-Căn hộ C1.T1)
                 */
                let infoG1A1 = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID: infoArea.parent, groupID: infoGroup.parent, userID })
                let infoG1A2 = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID, groupID: infoGroup.parent, userID })
                let infoG2A2 = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID, groupID, userID })                    

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name: Xóa
     * Author: HiepNH
     * Code: 2/10/2022
     */
    remove({ docID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(docID))
                    return resolve({ error: true, message: 'Request params docID invalid', status: 400 });
         
                let infoDataAfterRemove = await INSPECTION__DOC_COLL.findByIdAndUpdate(docID, { state: 2 }, { new: true });
                if(!infoDataAfterRemove)
                    return resolve({ error: true, message: "Can't remove inspection docs", status: 403 });

                return resolve({ error: false, data: "Remove success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Lấy thông tin
     * Author: HiepNH
     * Code: 2/10/2022
     */
    getInfo({ docID, select }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(docID))
                    return resolve({ error: true, message: 'Request params docID invalid', status: 400 });
                
                let infoDocs = await INSPECTION__DOC_COLL.findById(docID)
                    .select(select)
                    .populate({
                        path: "author",
                        select: "_id image fullname"
                    })
                    .populate({
                        path: "assignee",
                        select: "image fullname"
                    })
                    .populate({
                        path: "companyOfAuthor",
                        select: "_id image name sign"
                    })
                    .populate({
                        path: "companyOfAssignee",
                        select: "image name sign"
                    })
                    .populate({ 
                        path: "project",
                        select: "name area",
                    })
                    .populate({
                        path: "members",
                        select: "image fullname"
                    })
                    .populate({
                        path: "contract",
                        select: "name"
                    })
                    .populate({
                        path: "template",
                        select: "name"
                    })

                if(!infoDocs)
                    return resolve({ error: true, message: "Can't get info inspection docs", status: 403 });
                
                return resolve({ error: false, data: {infoDocs}, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name: Danh sách
     * - Theo gói thầu (hợp đồng)
     * - Theo ngày tháng tạo/hoàn thành (from-to)
     * - Theo Nhóm công tác con-khu vực con
     * Author: HiepNH
     * Code: 2/10/2022
     */

}

exports.MODEL = new Model;