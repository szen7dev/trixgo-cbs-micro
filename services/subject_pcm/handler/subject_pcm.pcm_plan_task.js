/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const SUBJECT_PCM__PCM_PLAN_TASK_MODEL          = require('../model/subject_pcm.pcm_plan_task').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: insert pcm_plan_task
	 */
    insert: {
        auth: "required",
        params: {
            name             : { type: "string" },
            projectID        : { type: "string" },
            groupID          : { type: "string" },
            assigneeID       : { type: "string" },
            relatedIDs       : { type: "array", optional: true },
            authorAttachs    : { type: "array", optional: true },
            actualStartTime  : { type: "string", optional: true },
            type             : { type: "number", optional: true },
            isproposal       : { type: "number", optional: true },
            description      : { type: "string", optional: true },
            sign             : { type: "string", optional: true },
            startTime        : { type: "string", optional: true },
            startHour        : { type: "string", optional: true },
            expiredHour      : { type: "string", optional: true },
            expiredTime      : { type: "string", optional: true },
            parentID         : { type: "string", optional: true },
            docreID          : { type: "string", optional: true },
            messageID        : { type: "string", optional: true },
            contractID       : { type: "string", optional: true },
            documentID       : { type: "string", optional: true },
            boardID          : { type: "string", optional: true },
            reportID         : { type: "string", optional: true },
            groupReportID    : { type: "string", optional: true },
            draft            : { type: "string", optional: true },
            template         : { type: "number", optional: true },
            workflowTemplate : { type: "string", optional: true },
            amountoftime     : { type: "string", optional: true },
            amountPerHour    : { type: "string", optional: true },
            field            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                
				let { _id: userID } = ctx.meta.infoUser;
                let { projectID, groupID, name, description, relatedIDs, authorAttachs, sign, assigneeID, startTime, startHour, expiredHour, expiredTime, actualStartTime, parentID, docreID, messageID, contractID, documentID, boardID, reportID, groupReportID, draft, isproposal, template, workflowTemplateID, amountoftime, amountPerHour, fieldID } = ctx.params;

                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_MODEL.insert({
                    projectID, groupID, authorID: userID, name, description, relatedIDs, sign, assigneeID, startTime, startHour, expiredHour, expiredTime, actualStartTime, parentID, docreID, messageID, contractID, documentID, boardID, reportID, groupReportID, draft, isproposal, template, workflowTemplateID, amountoftime, amountPerHour, fieldID,  authorAttachs, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: update pcm_plan_task
	 */
    update: {
        // auth: "required",
        params: {
            taskID         : { type: "string" },
            sign           : { type: "string", optional: true },
            name           : { type: "string", optional: true },
            sign           : { type: "string", optional: true },
            description    : { type: "string", optional: true },
            startTime      : { type: "string", optional: true },
            expiredTime    : { type: "string", optional: true },
            amountoftime   : { type: "string", optional: true },
            amountPerHour  : { type: "string", optional: true },
            assigneeID     : { type: "string", optional: true },
            progressType   : { type: "string", optional: true },
            fieldID        : { type: "string", optional: true },
            contractID     : { type: "string", optional: true },
            draft          : { type: "number", optional: true },
            isproposal     : { type: "number", optional: true },
            userIDDelete   : { type: "number", optional: true },
            typeUpdate     : { type: "number", optional: true },
            flags          : { type: "array", optional: true },
            related        : { type: "array", optional: true },
            lastLogID      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {
                    typeUpdate,
                    taskID, sign, name, description, note, startTime, expiredTime, amountoftime, amountPerHour, assigneeID, progressType, fieldID, 
                    contractID, draft, isproposal, usersDelete, related, offtimeReason, offbudgetReason, templateID, priority, status, lock, signatures, 
                    links, authorAttachs, assigneeAttachs, percentage, judgement, overdue, score, urgent, difficult, finishTime, punish, approver, timeApproved, 
                    valueApproved, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedUsers, openedStatus, flags, lastLogID
                 } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // Bước check quyền
                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_MODEL.update({
                    typeUpdate,
                    taskID, sign, name, description, note, startTime, expiredTime, amountoftime, amountPerHour, assigneeID, userID, progressType, fieldID, 
                    contractID, draft, isproposal, usersDelete, related, offtimeReason, offbudgetReason, templateID, priority, status, lock, signatures, 
                    links, authorAttachs, assigneeAttachs, percentage, judgement, overdue, score, urgent, difficult, finishTime, punish, approver, timeApproved, 
                    valueApproved, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedUsers, openedStatus, flags, lastLogID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        // auth: "required",
        params: {
            // Field bổ sung
            projectID   : { type: "string", optional: true },
            draft       : { type: "string", optional: true },
            type        : { type: "string", optional: true },
            status      : { type: "string", optional: true },
            typeStatus  : { type: "string", optional: true },
            taskID      : { type: "string", optional: true },
            collection  : { type: "string", optional: true },
            assigneeID  : { type: "string", optional: true },
            authorID    : { type: "string", optional: true },
            isproposal  : { type: "string", optional: true },
            isExpired   : { type: "string", optional: true },
            fromDate    : { type: "string", optional: true },
            toDate      : { type: "string", optional: true },
            parentID    : { type: "string", optional: true },
            companyOfAuthor  : { type: "string", optional: true },
            companyOfAssignee: { type: "string", optional: true },
            fieldID          : { type: "string", optional: true },
            isSortChecklist  : { type: "string", optional: true },
            isChecklist      : { type: "string", optional: true },
            
            // Field mặc định
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                
                let { 
                    taskID, projectID, status, draft, type, typeStatus, collection, assigneeID, authorID, isproposal, isExpired, 
                    fromDate, toDate, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist, isChecklist,
                    keyword, limit, lastestID, select, populates
                } = ctx.params;

                console.log({ meta: ctx.meta, infoUser: ctx.meta.infoUser })
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                // Trường hợp nếu có taskID thì gọi function lấy chi tiết task, ngược lại gọi function lấy danh sách task
                if(taskID){
                    resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_MODEL.getInfo({
                        taskID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_MODEL.getList({
                        userID, projectID, status, draft, type, typeStatus, collection, assigneeID, authorID, isproposal, 
                        isExpired, fromDate, toDate, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist, isChecklist,
                        keyword, limit, select, lastestID, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.error(error);
                return { error: true, message: error.message };
            }
        }
    },
    
    /**
	 * Dev: Depv ✅
	 * Func: Lấy số lượng công việc của bạn để hiển thị ngoài trang chủ
	 */
    getAmountTask: {
        auth: "required",
        params: {},
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;

                // Bước check quyền
                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_MODEL.getAmountTask({ userID });
                // let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_MODEL.updateCompanyOfAuthorAndCompanyOfAssignee();
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

}