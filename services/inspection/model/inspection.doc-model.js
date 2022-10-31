"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, validateParamsObjectID }                        
                                        = require('../../../tools/utils/utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const { RANGE_BASE_PAGINATION_V2 } 		= require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR, APP_KEYS, LANGUAGE_KEYS }    = require('../../../tools/keys');
const moment                            = require('moment')
const XlsxPopulate                      = require('xlsx-populate');
const path                              = require('path');
const fs                                = require('fs');
const { addDate, calculateExpireTime }          = require('../../../tools/utils/time_utils');
const stringUtils					            = require('../../../tools/utils/string_utils');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

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
    insert({ contractID, areaID, groupID, sign, templateID, assigneeID, relatedIDs, name, expiredTime, description, belongSystem, authorAttachs, userID, ctx }) { 
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
                        company: infoContract.company, 
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
                    if(templateID && checkObjectIDs(templateID)){
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
                    // console.log(listTemplateChecklist)
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
                    // let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_UPDATE}`, {
                    //     departmentID: infoContract.project, inspectionTasks: 1
                    // })
                    // console.log(infoProject)
                    
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
    update({ taskID, sign, assigneeID, name, expiredTime, description, status, relatedIDs, percentage, linksDocs, optionSeen, userID }) { 
        // console.log({ taskID, sign, assigneeID, name, expiredTime, description, status, relatedIDs, percentage, linksDocs, optionSeen, userID })
        return new Promise(async (resolve) => {
            try {
                /**
                 * Cập nhật trạng thái xem/chưa xem
                 */
                if(!optionSeen){
                    let infoDoc = await INSPECTION__DOC_COLL.findById(taskID)
                    if(!infoDoc)
                        return resolve({ error: true, message: "Can't get info inspection docs", status: 400 });
    
                    let dataUpdate = { userUpdate: userID, modifyAt: Date.now()};
                    let dataAddToset = {};
                    let dataPullAll  = {};
    
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

                    //_________Thêm người liên quan
                    if(checkObjectIDs(relatedIDs)){
                        let related = relatedIDs.map(item=>item)
                        dataAddToset = {
                            ...dataAddToset,
                            related
                        }
                    }

                    if(checkObjectIDs(linksDocs)){
                        dataAddToset = { ...dataAddToset, linksDocs }
                    }
    
                    if(expiredTime){
                        dataUpdate.expiredTime = expiredTime;
                    }
    
                    if(description){
                        dataUpdate.description = description;
                    }

                    if(dataAddToset){
                        dataUpdate.$addToSet = dataAddToset;
                    }
    
                    /**
                     * Nếu cập nhật về trạng thái hoàn thành
                     */
                    if(status && !isNaN(status)){
                        if(status == this.STATUS_DONE){
                            dataUpdate.status = this.STATUS_DONE;
                            dataUpdate.percentage = 100;
                            dataUpdate.finishedTime = new Date(); // Ngày hoàn thành thực tế
                        }else{
                            dataUpdate.status = Number(status)
                        }
                    }

                    // console.log('=================>>>>>>>>>>>>>>>>>')
                    // console.log(dataUpdate)

                    let infoDataAfterUpdate = await INSPECTION__DOC_COLL.findByIdAndUpdate(taskID, dataUpdate, { new: true });
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
                            { _id: { $in: [taskID] } },
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
    getInfo({ taskID, userID, select, populates  }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'Request params taskID invalid', status: 400 });

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
                
                let infoDocs = await INSPECTION__DOC_COLL.findById(taskID)
                .select(select)
                .populate(populates).lean();

                await INSPECTION__DOC_COLL.findByIdAndUpdate(taskID, {
                    $addToSet: { viewedUsers: userID },
                });

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

    /**
     * Dev: HiepNH
     * Func: Tìm kiếm Task
     * Date: 31/10/2022
     */
    getListByFilter({
        fromDate, toDate, month, year, assigneesID, companiesOfAssignee, authorsID, companiesOfAuthor,
        projectsID, status, isExpired, read, isGrant, priority, reportType, 
        keyword, unlimited, limit = 50, lastestID, select, populates,
        userID
    }) {
        console.log('=============Danh sách công việc TÌM KIẾM=============>>>>>>>>>>>')
        console.log({ fromDate, toDate, month, year, assigneesID, companiesOfAssignee, authorsID, companiesOfAuthor,
            projectsID, status, isExpired, read, priority, reportType, 
            keyword, unlimited, limit, lastestID, select, populates,
            userID})
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 */
                let conditionObjYear

                // Phân trang
                if(limit > 50 && isNaN(limit)){
                    limit = 50;
                } else{
                    limit = +limit;
                }

                /**
                 * VALIDATION (1)
                 */
                const validation = validateParamsObjectID({
                    companiesOfAssignee : { value: companiesOfAssignee, isRequire: false },
                    assigneesID         : { value: assigneesID, isRequire: false },
                    authorsID           : { value: authorsID, isRequire: false },
                    companiesOfAuthor   : { value: companiesOfAuthor, isRequire: false },
                    projectsID          : { value: projectsID, isRequire: false },
                });
                if(validation.error) return resolve(validation);

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

                /**
                 * DECALARTION VARIABLE (2)
                 */
                let conditionObj = {
                    usersDelete: { $nin: [userID] },
                };

                let nextCursor  = null;
                let sortBy      = null;
                let keys	 = ['modifyAt__-1', '_id__-1'];
                // let keys	    = ['actualFinishTime__-1', '_id__-1'];

                /**
                 * Kiểm soát quyền truy cập Task
                 */
                if(isGrant && Number(Grant) == 1){
                    conditionObj.$or = [
                        { author: userID },
                        { assignee: userID },
                        { related: { $in: [userID] }},
                    ]
                }

                /**
                 * PHÂN LOẠI CÔNG VIỆC
                 * 1-Việc của tôi
                 * 2-Việc giao người khác
                 * 3-Việc liên quan
                 */
                if(reportType == 1){
                    conditionObj.assignee = userID;
                    delete conditionObj.$or
                }

                /**
                 * Bộ lọc với nhiều lựa chọn
                 */
                assigneesID && assigneesID.length                   && (conditionObj.assignee = { $in: assigneesID })
                companiesOfAssignee && companiesOfAssignee.length   && (conditionObj.companyOfAssignee = { $in: companiesOfAssignee })
                authorsID && authorsID.length                       && (conditionObj.author = { $in: authorsID })
                companiesOfAuthor && companiesOfAuthor.length       && (conditionObj.companyOfAuthor = { $in: companiesOfAuthor })
                projectsID && projectsID.length                     && (conditionObj.project = { $in: projectsID })
                status && status.length                             && (conditionObj.status = { $in: status })

                // Chưa xem (user nắm trong mảng new)
                if(read && read == 1){
                    conditionObj.news = { $in: [userID] }
                }
                // Đã xem (user bị xoá ra khỏi mảng news)
                if(read && read == 2){
                    conditionObj.news = { $nin: [userID] }
                }

                /**
                 * Quá hạn
                 */
                if(isExpired){
                    // Đã quá hạn
                    if(isExpired == 1) {
                        conditionObj.status = { $ne: 4 }; // Chưa hoàn thành
                        conditionObj.expiredTime = {
                            $lt: new Date()
                        }
                    }

                    // Chưa quá hạn
                    if(isExpired == 2) {
                        conditionObj.expiredTime = {
                            $gt: new Date()
                        }
                    }
                }else{
                    /**
                     * Lấy những công việc từ ngày đến ngày
                     * - Sẽ không cùng diễn ra với Lọc quá hạn
                     */
                    if(fromDate && toDate){
                        conditionObj.expiredTime = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }
                }

                if(!isNaN(year) && Number(year) >= 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }

                    if(!isNaN(month) && Number(month) > 0){
                        conditionObjYear = {
                            "year": Number(year),
                            "month": Number(month),
                        }
                    }

                    console.log(conditionObj)
                    console.log(conditionObjYear)
                    let listDataAgg = await INSPECTION__DOC_COLL.aggregate([
                        {
                            $match: {}
                        },
                        {
                            $project : {
                                year : {$year : "$finishedTime"},
                                month : {$month : "$finishedTime"},
                                area : 1,
                                parentArea : 1,
                                group : 1,
                                parentGroup : 1,
                                status : 1,
                                expiredTime : 1,
                                finishedTime : 1,
                                percentage : 1,
                                author : 1,
                                companyOfAuthor : 1,
                                assignee : 1,
                                companyOfAssignee : 1,
                                project : 1,
                                contract : 1,
                                priority : 1,
                            }
                        },
                        {
                            $match: conditionObjYear
                        },
                    ])

                    // console.log(listDataAgg)
                    // conditionObj._id = {$in: listDataAgg.map(item=>item._id)}
                    // console.log(conditionObj)
                }

                /**
                 * Việc quan trọng
                 */
                if(priority && Number(priority) > 0){
                    conditionObj.priority = Number(priority)
                }

                // Tìm kiếm theo keyword
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i')
                    // conditionObj.$or = [
                    //     { name  :  new RegExp(keyword, 'i') },
                    //     { description  :  new RegExp(keyword, 'i') }
                    // ]
                }
                // console.log('========================')
                // console.log(conditionObj)

                let conditionObjOrg = {...conditionObj};
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await INSPECTION__DOC_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                /**
                 * Dùng để lấy all data, Chỉ:
                 * - Dùng internal services
                 * - Không cho client truyền qua API
                 */
                if(unlimited) {
                    const infoDataAfterGet = await INSPECTION__DOC_COLL
                        .find(conditionObj)
                        .select(select)
                        .populate(populates)
                        .sort(sortBy)
                        .lean();

                    return resolve({
                        data: infoDataAfterGet
                    });
                }

                /**
                 * QUERY DATABASE (4)
                 */
                const infoDataAfterGet = await INSPECTION__DOC_COLL
                    .find(conditionObj)
                    .limit(limit+1)
                    .select(select)
                    .populate(populates)
                    .sort(sortBy)
                    .lean();

                if(!infoDataAfterGet) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                const totalRecord = await INSPECTION__DOC_COLL.countDocuments(conditionObjOrg);
                const totalPage   = Math.ceil(totalRecord / limit);

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        listRecords: infoDataAfterGet,
                        limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                    },
                });
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
    getListByProperty({ option, optionProcess, optionArea, optionGroup, optionTime, optionContract, optionAssignee, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, year, month, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) { 
        // console.log({ option, optionProcess, optionArea, optionGroup, optionTime, optionContract, optionAssignee, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, year, month, keyword, limit, lastestID, select, populates, sortKey, userID })
        return new Promise(async (resolve) => {
            try {
                if(!option){
                    
                }else{
                    let conditionObj = {}
                    
                    // Hoàn thành
                    if(optionProcess && Number(optionProcess) == 1){
                        conditionObj.status = 4
                    }

                    let conditionGroup = {
                        _id: { },
                        amount: { $sum: 1 },
                    }
                    let conditionObjYear = {}, conditionPopulate = {}, sortBy = {"amount": 1}

                    /**
                     * Gom nhóm theo đối tượng
                     * - Dự án
                     * - Hợp đồng
                     */
                    if(contractID && checkObjectIDs(contractID)){
                        conditionObj.contract = ObjectID(contractID)
                    }else{
                        if(projectID && checkObjectIDs(projectID)){
                            conditionObj.project = ObjectID(projectID)
                        }
                    }

                    /**
                     * Theo Bộ môn
                     */
                    if(option && Number(option) == 1){
                        if(optionGroup && Number(optionGroup) == 1){
                            conditionGroup = {
                                _id: { parentGroup: "$parentGroup" },
                                amount: { $sum: 1 },
                            }

                            // Gom nhóm theo các khu vực cha
                            if(optionArea && Number(optionArea) == 1){
                                conditionObj.parentGroup = ObjectID(parentGroupID)
                                conditionGroup = {
                                    _id: { parentArea: "$parentArea" },
                                    amount: { $sum: 1 },
                                }
                            }

                            // Gom nhóm theo các khu vực con
                            if(optionArea && Number(optionArea) == 2){
                                conditionObj.parentGroup = ObjectID(parentGroupID)
                                conditionObj.parentArea = ObjectID(parentAreaID)
                                conditionGroup = {
                                    _id: { area: "$area" },
                                    amount: { $sum: 1 },
                                }
                            }

                            // Tính tổng trạng thái theo phân loại
                            if(optionArea && Number(optionArea) == 21){
                                conditionObj.parentGroup = ObjectID(parentGroupID)
                                conditionObj.parentArea = ObjectID(parentAreaID)
                                conditionGroup = {
                                    _id: { status: "$status" },
                                    amount: { $sum: 1 },
                                }
                            }

                            // Gom nhóm theo các khu vực con
                            if(optionArea && Number(optionArea) == 3){
                                conditionObj.parentGroup = ObjectID(parentGroupID)
                                conditionObj.area = ObjectID(areaID)
                                conditionGroup = {
                                    _id: { group: "$group" },
                                    amount: { $sum: 1 },
                                }
                            }

                            // Tính tổng trạng thái theo phân loại
                            if(optionArea && Number(optionArea) == 31){
                                conditionObj.parentGroup = ObjectID(parentGroupID)
                                conditionObj.area = ObjectID(areaID)
                                conditionGroup = {
                                    _id: { status: "$status" },
                                    amount: { $sum: 1 },
                                }
                            }

                            // Tính tổng trạng thái theo phân loại
                            if(optionArea && Number(optionArea) == 31){
                                conditionObj.parentGroup = ObjectID(parentGroupID)
                                conditionObj.area = ObjectID(areaID)
                                conditionGroup = {
                                    _id: { status: "$status" },
                                    amount: { $sum: 1 },
                                }
                            }

                            // Tính tổng trạng thái theo Căn hộ-Nhóm công tác
                            if(optionArea && Number(optionArea) == 41){
                                console.log('Tính tổng trạng thái theo Căn hộ-Nhóm công tác')

                                conditionObj.area = ObjectID(areaID)
                                conditionObj.area = ObjectID(areaID)
                                conditionGroup = {
                                    _id: { status: "$status" },
                                    amount: { $sum: 1 },
                                }
                            }
                        }
                    }

                    /**
                     * Theo Tháng/năm
                     */
                    if(option && Number(option) == 2){
                        if(optionTime && Number(optionTime) == 1){
                            conditionGroup = {
                                _id: { year: "$year" },
                                amount: { $sum: 1 },
                            }
                        }
    
                        if(optionTime && Number(optionTime) == 2){
                            if(!isNaN(year) && Number(year) >= 0){
                                conditionObjYear = {
                                    "year": Number(year),
                                }
                            }
    
                            conditionGroup = {
                                _id: { month: "$month", year: "$year" },
                                amount: { $sum: 1 },
                            }
                        }  
                    }

                    /**
                     * Theo Đơn vị
                     */
                    if(option && Number(option) == 3){
                        conditionGroup = {
                            _id: { companyOfAuthor: "$companyOfAuthor" },
                            amount: { $sum: 1 },
                        }

                        conditionPopulate = {
                            path: '_id.companyOfAuthor',
                            select: '_id name sign image',
                            model: 'company'
                        }
                    }

                    /**
                     * Theo Người thực hiện
                     */
                    if(option && Number(option) == 4){
                        if(!isNaN(year) && Number(year) >= 0){
                            conditionObjYear = {
                                "year": Number(year),
                            }

                            if(!isNaN(month) && Number(month) > 0){
                                conditionObjYear = {
                                    "year": Number(year),
                                    "month": Number(month),
                                }
                            }
                        }

                        conditionGroup = {
                            _id: { assignee: "$assignee" },
                            amount: { $sum: 1 },
                        }

                        conditionPopulate = {
                            path: '_id.assignee',
                            select: '_id name sign fullname image',
                            model: 'user'
                        }
                    }

                     /**
                     * Theo Hợp đồng
                     */
                    if(option && Number(option) == 5){
                        if(optionAssignee && Number(optionAssignee) == 1){
                            conditionGroup = {
                                _id: { assignee: "$assignee" },
                                amount: { $sum: 1 },
                            }
                        }
                    }

                    console.log(conditionObj)
                    console.log(conditionObjYear)
                    console.log(conditionGroup)

                    // Danh sách đang triển khai
                    let listData = await INSPECTION__DOC_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project : {
                                year : {$year : "$finishedTime"},
                                month : {$month : "$finishedTime"},
                                area : 1,
                                parentArea : 1,
                                group : 1,
                                parentGroup : 1,
                                status : 1,
                                expiredTime : 1,
                                finishedTime : 1,
                                percentage : 1,
                                author : 1,
                                companyOfAuthor : 1,
                                assignee : 1,
                                companyOfAssignee : 1,
                                project : 1,
                                contract : 1,
                            }
                        },
                        {
                            $match: conditionObjYear
                        },
                        {
                            $group: conditionGroup
                        },
                        {
                            $sort: sortBy
                        }
                    ])

                    if(!isNaN(option) && [3,4].includes(Number(option))){
                        await INSPECTION__DOC_COLL.populate(listData, conditionPopulate)
                    }

                    return resolve({ error: false, data: listData });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;