"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const moment                            =  require("moment");
const { RANGE_BASE_PAGINATION_V2 } 		= require('../../../tools/cursor_base/playground/index');

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
    insert({ contractID, areaID, groupID, sign, templateID, assigneeID, related, name, expiredTime, description, belongSystem, userID }) { 
        // console.log({ contractID, areaID, groupID, sign, templateID, assigneeID, related, name, expiredTime, description, belongSystem, userID })
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Tạo biên bản (kiểm tra, nghiệm thu)
                 * 2-Cập nhật % hoàn thành/trạng thái cho Khu vực-Nhóm công tác
                 */
                let dataInsert = {};
                if(!isNaN(belongSystem) && belongSystem == 2){
                    dataInsert = { 
                        name, 
                        belongSystem: Number(belongSystem)
                    };

                    let infoDataAfterInserted = await this.insertData(dataInsert);
                    if(!infoDataAfterInserted)
                        return resolve({ error: true, message: "Can't create inspection doc", status: 403 });

                    return resolve({ error: false, data: infoDataAfterInserted, status: 200 });   
                }else{
                    if(!checkObjectIDs(contractID) || !checkObjectIDs(areaID) || !checkObjectIDs(groupID) || !checkObjectIDs(assigneeID) || !checkObjectIDs(userID))
                        return resolve({ error: true, message: 'Request params contractID|areaID|groupID|assigneeID|userID invalid', status: 400 })

                    let infoContract        = await ITEM__CONTRACT_COLL.findById(contractID).select('_id name project company')
                    let infoArea            = await INSPECTION__AREA_COLL.findById(areaID).select('_id name parent')
                    let infoGroup           = await INSPECTION__GROUP_COLL.findById(groupID).select('_id name parent')
                    let infoAssignee        = await AUTH__USER_COLL.findById(assigneeID).select('_id fullname company')
                    let infoAuthor          = await AUTH__USER_COLL.findById(userID).select('_id fullname company')
                    // console.log(infoContract)
                    // console.log(infoArea)
                    // console.log(infoGroup)
                    // console.log(infoAssignee)
                    // console.log(infoAuthor)

                    /**
                     * Kiểm tra chỉ cho phép Khu vực và Nhóm ở cấp 2
                     */
                    if(!checkObjectIDs(infoArea.parent) || !checkObjectIDs(infoGroup.parent))
                        return resolve({ error: true, message: 'areaID|groupID param_invalid', status: 400 });
                        
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

                    if(related && !checkObjectIDs(related)){
                        dataInsert.related = related;
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
                
                    /**
                     * Clone checklist từ Tempalte
                     * - Cân nhắc sử dụng luôn cùng Coll
                     */
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
                     * Tạo mới dữ liệu Group_Area
                     */
                    let infoG1A1 = await INSPECTION__AREA_GROUP_MODEL.insert({ projectID: infoContract.project, areaID: infoArea.parent, groupID: infoGroup.parent, userID })
                    let infoG1A2 = await INSPECTION__AREA_GROUP_MODEL.insert({ projectID: infoContract.project, areaID, groupID: infoGroup.parent, userID })
                    let infoG2A2 = await INSPECTION__AREA_GROUP_MODEL.insert({ projectID: infoContract.project, areaID, groupID, userID })

                    /**
                     * CẬP NHẬT TRẠNG THÁI CHO NHÓM CÔNG TÁC-KHU VỰC (cần kiểm tra lại cho kỹ)
                     * 1-Nhóm cha-Khu vực cha (Hoàn thiện-Tầng 1)
                     * 2-Nhóm cha-Khu vực con (Hoàn thiện-Căn hộ C1.T1)
                     * 3-Nhóm con-Khu vực con (Công tác xây-Căn hộ C1.T1)
                     */
                    let infoG1A1New = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID: infoArea.parent, groupID: infoGroup.parent, userID })
                    let infoG1A2New = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID, groupID: infoGroup.parent, userID })
                    let infoG2A2New = await INSPECTION__AREA_GROUP_MODEL.updateStatus({ areaID, groupID, userID })
                    
                    return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
                }                
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
    update({ docID, sign, templateID, assigneeID, name, expiredTime, description, status, related, userID }) { 
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

                if(checkObjectIDs(related)){
                    dataUpdate.$addToSet = {
                        related: related
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

    /**
     * Name: Lấy thông tin
     * Author: HiepNH
     * Code: 2/10/2022
     */
    getInfo({ docID, select }) { 
        return new Promise(async (resolve) => {
            try {
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
                        path: "related",
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
    getList({ projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, belongSystem, keyword, limit = 10, lastestID, select, populates }) { 
        console.log({ projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, belongSystem, keyword, limit, lastestID, select, populates })
        return new Promise(async (resolve) => {
            try {
                let conditionObj = {};
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(limit > 30){
                    limit = 30;
                } else{
                    limit = +limit;
                }

                if(!isNaN(belongSystem) && belongSystem == 2){
                    conditionObj.belongSystem = 2
                }

                if(checkObjectIDs(contractID)){
                    conditionObj.contract = contractID
                }else{
                    if(checkObjectIDs(projectID)){
                        conditionObj.project = projectID
                    }
                }

                if(checkObjectIDs(parentAreaID)){
                    conditionObj.parentArea = parentAreaID
                }

                if(checkObjectIDs(areaID)){
                    conditionObj.area = areaID
                }

                if(checkObjectIDs(parentGroupID)){
                    conditionObj.parentGroup = parentGroupID
                }

                if(checkObjectIDs(groupID)){
                    conditionObj.group = groupID
                }

                console.log(conditionObj)

                /**
                 * ĐIỀU KIỆN KHÁC
                 */
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}
 
                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await INSPECTION__DOC_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await INSPECTION__DOC_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await INSPECTION__DOC_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
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