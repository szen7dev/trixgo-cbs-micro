"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const { RANGE_BASE_PAGINATION_V2 } 		= require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR, APP_KEYS, LANGUAGE_KEYS }    = require('../../../tools/keys');
const moment                            = require('moment')
const XlsxPopulate                      = require('xlsx-populate');
const path                              = require('path');
const fs                                = require('fs');
const { addDate, calculateExpireTime }          = require('../../../tools/utils/time_utils');
const stringUtils					            = require('../../../tools/utils/string_utils');

/**
 * import inter-coll, exter-coll
 */
const AUTH__USER_COLL                      = require('../../auth/database/auth.user-coll');
const ITEM__CONTRACT_COLL                  = require('../../item/database/item.contract-coll');
const INSPECTION__DOC_COLL                 = require('../database/inspection.doc-coll');
const INSPECTION__AREA_COLL                = require('../database/inspection.area-coll');
const INSPECTION__GROUP_COLL               = require('../database/inspection.group-coll');
const INSPECTION__AREA_GROUP_COLL          = require('../database/inspection.area_group-coll');
const INSPECTION__CHECKLIST_COLL           = require('../database/inspection.checklist-coll');

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
    insert({ contractID, areaID, groupID, sign, templateID, assigneeID, relatedIDs, name, expiredTime, description, belongSystem, authorAttachs, userID }) { 
        // console.log({ contractID, areaID, groupID, sign, templateID, assigneeID, related, name, expiredTime, description, belongSystem, userID })
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Tạo biên bản (kiểm tra, nghiệm thu)
                 * 2-Cập nhật % hoàn thành/trạng thái cho Khu vực-Nhóm công tác
                 */
                let dataInsert = {};
                let accessUsers = [userID, assigneeID];
                let suid = await stringUtils.randomAndCheckExists(INSPECTION__DOC_COLL, 'suid');

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
                        companyOfAssignee: infoAssignee.company,
                        suid,
                        accessUsers,
                    };

                    /**
                     * Gán template và tạo checklist đi kèm
                     */
                    if(templateID && !checkObjectIDs(templateID)){
                        dataInsert.template = templateID;
                    }

                    if(relatedIDs && relatedIDs.length){
                        relatedIDs = [...new Set(relatedIDs)];
    
                        if(!checkObjectIDs(relatedIDs)) {
                            return resolve({ error: true, message: "relatedIDs_invalid", status: 400 });
                        }
                        dataInsert.related = relatedIDs;
                        accessUsers.push(...relatedIDs);
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

                    //_______File của người tạo việc
                    if(checkObjectIDs(authorAttachs)){
                        dataInsert.authorAttachs = authorAttachs;
                    }

                    /**
                     * Những user chưa xem công việc
                     * - Sẽ xóa user khi bấm xem
                     * - Sẽ thêm user khi có thông báo mới
                     */
                    dataInsert.news = accessUsers.filter(item => item !== userID); 
                    console.log(dataInsert)

                    let infoDataAfterInserted = await this.insertData(dataInsert);
                    if(!infoDataAfterInserted)
                        return resolve({ error: true, message: "Can't create inspection doc", status: 403 });
                
                    /**
                     * Clone checklist từ Tempalte
                     * - Cân nhắc sử dụng luôn cùng Coll
                     */
                    let listTemplateChecklist = await INSPECTION__CHECKLIST_COLL.find({ inspection: templateID });
                    console.log(listTemplateChecklist)
                    if(listTemplateChecklist.length){
                        for (const item of listTemplateChecklist) {
                            let { name, description } = item;
                            let infoChecklistAfterInsert = await INSPECTION__CHECKLIST_MODEL.insert({
                                inspectionID: infoDataAfterInserted._id, name, description, userID
                            })
                        }
                    }

                    /**
                     * CẬP NHẬT THÔNG TIN DỰ ÁN
                     */
                    
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
    update({ docID, sign, assigneeID, name, expiredTime, description, status, related, percentage, option, optionSeen, userID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * Cập nhật trạng thái xem/chưa xem
                 */
                if(!optionSeen){
                    let infoDoc = await INSPECTION__DOC_COLL.findById(docID)
                    if(!infoDoc)
                        return resolve({ error: true, message: "Can't get info inspection docs", status: 400 });
    
                    let dataUpdate = { userUpdate: userID, modifyAt: Date.now()};
    
                    if(assigneeID && checkObjectIDs(assigneeID)){
                        dataUpdate.assignee = assigneeID;
                    }
    
                    if(name && name != ""){
                        dataUpdate.name = name;
                    }
    
                    if(sign){
                        dataUpdate.sign = sign;
                    }
    
                    if(!isNaN(percentage)){
                        dataUpdate.percentage = Number(percentage);
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
                        dataUpdate.percentage = 100;
                        dataUpdate.finishedTime = new Date(); // Ngày hoàn thành thực tế
                    }else{
                        dataUpdate.status = Number(status)
                    }

                    let infoDataAfterUpdate = await INSPECTION__DOC_COLL.findByIdAndUpdate(docID, dataUpdate, { new: true });
                    if(!infoDataAfterUpdate)
                        return resolve({ error: true, message: "Can't update docs", status: 403 });
    
                    /**
                     * CẬP NHẬT THÔNG TIN DỰ ÁN
                     */      
    
                    return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
                }else{
                    // Cập nhật các Task được lựa chọn
                    if(optionSeen == 1){
                        let infoTaskAfterUpdate = await INSPECTION__DOC_COLL.updateMany(
                            { _id: { $in: [docID] } },
                            { $pull: { news: userID } },
                            { new: true }
                        );

                        if (!infoTaskAfterUpdate)
                            return resolve({ error: true, message: 'cannot_update', keyError: KEY_ERROR.UPDATE_FAILED });
                    }

                    // Cập nhật tất cả các Task của user chưa đọc
                    if(optionSeen == 2){
                        let infoTaskAfterUpdate = await INSPECTION__DOC_COLL.updateMany(
                            { news: { $in: userID } },
                            { $pull: { news: userID } },
                            { new: true }
                        );

                        if (!infoTaskAfterUpdate)
                            return resolve({ error: true, message: 'cannot_update', keyError: KEY_ERROR.UPDATE_FAILED });
                    }

                    return resolve({ error: false, message: "update_success" })
                }
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
    getList({ option, optionSeen, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) { 
        // console.log({ option, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, keyword, limit, lastestID, select, populates, userID })
        return new Promise(async (resolve) => {
            try {
                if(!option){
                    if(Number(limit) > 50){
                        limit = 50;
                    } else{
                        limit = +Number(limit);
                    }

                    let conditionObj = {}
                    let sortBy;
                    let keys	 = ['modifyAt__-1'];
    
                    // Làm rõ mục đích để làm gì?
                    if (sortKey && typeof sortKey === 'string') {
                        if (!IsJsonString(sortKey))
                            return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });
    
                        keys = JSON.parse(sortKey);
                    }
    
                    if(!isNaN(belongSystem) && belongSystem == 2){
                        conditionObj.belongSystem = 2
                    }else{
                        // Các việc chưa hoàn thành
                        if(statusNe){
                            conditionObj.status = { $ne: statusNe };
                        }

                        // Lấy công việc mà user được quyền truy cập
                        conditionObj.$or = [
                            { author: userID },
                            { assignee: userID },
                            { related: { $in: [userID] }},
                        ]

                        conditionObj.usersDelete = { $nin: [userID] }

                        // Việc chưa xem
                        if(optionSeen && optionSeen == 1){
                            conditionObj.news = { $in: [userID] }
                        }

                        // Việc đã xem
                        if(optionSeen && optionSeen == 2){
                            conditionObj.news = { $nin: [userID] }
                        }
                    }
    
                    // if(checkObjectIDs(contractID)){
                    //     conditionObj.contract = contractID
                    // }else{
                    //     if(checkObjectIDs(projectID)){
                    //         conditionObj.project = projectID
                    //     }
                    // }
    
                    // if(checkObjectIDs(parentAreaID)){
                    //     conditionObj.parentArea = parentAreaID
                    // }
    
                    // if(checkObjectIDs(areaID)){
                    //     conditionObj.area = areaID
                    // }
    
                    // if(checkObjectIDs(parentGroupID)){
                    //     conditionObj.parentGroup = parentGroupID
                    // }
    
                    // if(checkObjectIDs(groupID)){
                    //     conditionObj.group = groupID
                    // }
    
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
                }else{
                    let start = new Date();
                    start.setHours(0,0,0,0);
                    let end = new Date();
                    end.setHours(23,59,59,999);

                    let amountUnreadTask=0,amountMyTask1=0,amountMyTask2=0,amountMyTask3=0

                    // Số công việc chưa xem
                    amountUnreadTask = await INSPECTION__DOC_COLL.count({
                        news: { $in: [userID] },
                        usersDelete: { $nin: [userID] }
                    })

                    // Số công việc của tôi - Quá hạn
                    amountMyTask1 = await INSPECTION__DOC_COLL.count({
                        assignee: userID,
                        status: { $ne: 4 },
                        usersDelete: { $nin: [userID] },
                        expiredTime: { $lt: start }
                    })

                    // Số công việc của tôi - Tuần tới
                    amountMyTask2 = await INSPECTION__DOC_COLL.count({
                        assignee: userID,
                        status: { $ne: 4 },
                        usersDelete: { $nin: [userID] },
                        expiredTime: { 
                            $gte:  moment(start).startOf('day')._d,
                            $lt: moment(addDate(7)).endOf('day')._d
                        }
                    })

                    // Số công việc của tôi - Sau tuần tới
                    amountMyTask3 = await INSPECTION__DOC_COLL.count({
                        assignee: userID,
                        status: { $ne: 4 },
                        usersDelete: { $nin: [userID] },
                        expiredTime: { 
                            $gte: addDate(7)
                        }
                    })

                    return resolve({ error: false, data: {
                        amountUnreadTask, amountMyTask1, amountMyTask2, amountMyTask3
                    }});
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;