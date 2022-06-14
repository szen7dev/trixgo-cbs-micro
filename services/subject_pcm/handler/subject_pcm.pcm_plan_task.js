/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const PCM_PLAN_TASK_MODEL             = require('../model/subject_pcm.pcm_plan_task').MODEL;

module.exports = {
    /**
	 * Dev: Depv
	 * Func: insert pcm_plan_task
	 */
    insert: {
        auth: "required",
        params: {
            name             : { type: "string" },
            projectID        : { type: "string" },
            groupID          : { type: "string" },
            assigneeID       : { type: "string" },
            authorAttachs    : { type: "array", optional: true },
            actualStartTime  : { type: "string", optional: true },
            type             : { type: "number", optional: true },
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
            fieldID          : { type: "string", optional: true },
            subType          : { type: "number", optional: true },
            select           : { type: "string", optional: true },
            populates        : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

				const { _id: authorID, bizfullname } = ctx.meta.infoUser;
                const { projectID, groupID, name, description, relatedIDs, authorAttachs, sign, assigneeID, startTime, startHour, expiredHour, expiredTime, actualStartTime, parentID, docreID, messageID, contractID, documentID, boardID, reportID, groupReportID, draft, template, workflowTemplateID, amountoftime, amountPerHour, fieldID, type, subType, select, populates } = ctx.params;

                const resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.insert({
                    projectID, groupID, authorID, name, description, relatedIDs, sign, assigneeID, startTime, startHour, expiredHour, expiredTime, actualStartTime, parentID, docreID, messageID, contractID, documentID, boardID, reportID, groupReportID, draft, template, workflowTemplateID, amountoftime, amountPerHour, fieldID, authorAttachs, type, subType, bizfullname, select, populates, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: update pcm_plan_task
	 */
    update: {
        auth: "required",
        params: {
            taskID         : { type: "string" },
            sign           : { type: "string", optional: true },
            name           : { type: "string", optional: true },
            sign           : { type: "string", optional: true },
            description    : { type: "string", optional: true },
            actualStartTime: { type: "string", optional: true },
            actualFinishTime: { type: "string", optional: true },
            expiredHour      : { type: "string", optional: true },
            amountoftime   : { type: "string", optional: true },
            amountPerHour  : { type: "string", optional: true },
            assigneeID     : { type: "string", optional: true },
            progressType   : { type: "string", optional: true },
            fieldID        : { type: "string", optional: true },
            contractID     : { type: "string", optional: true },
            draft          : { type: "number", optional: true },
            userIDDelete   : { type: "number", optional: true },
            typeUpdate     : { type: "number", optional: true },
            flags          : { type: "array", optional: true },
            flagsRemoves   : { type: "array", optional: true },
            related        : { type: "array", optional: true },
            relatedRemoves : { type: "array", optional: true },
            lastLogID      : { type: "string", optional: true },
            isAddSignature : { type: "boolean", optional: true },
            isOpenBidding : { type: "boolean", optional: true },
            authorAttachs  : { type: "array", optional: true },
            assigneeAttachs: { type: "array", optional: true },
            milestone      : { type: "number", optional: true },
            subType          : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const {
                    typeUpdate,
                    taskID, sign, name, description, note, actualStartTime, actualFinishTime, amountoftime, amountPerHour, assigneeID, progressType, fieldID, expiredHour,
                    contractID, draft, subType, usersDelete, related, relatedRemoves, offtimeReason, offbudgetReason, templateID, priority, status, lock, signatures,
                    links, authorAttachs, assigneeAttachs, percentage, judgement, overdue, score, urgent, difficult, finishTime, punish, approver, timeApproved,
                    valueApproved, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedUsers, openedStatus, flags, flagsRemoves, lastLogID, isAddSignature, isOpenBidding, milestone
                 } = ctx.params;
				const { _id: userID, bizfullname, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.update({
                    typeUpdate,
                    taskID, sign, name, description, note, actualStartTime, actualFinishTime, amountoftime, amountPerHour, assigneeID, userID, progressType, fieldID, expiredHour,
                    contractID, draft, subType, usersDelete, related, relatedRemoves, offtimeReason, offbudgetReason, templateID, priority, status, lock, signatures,
                    links, authorAttachs, assigneeAttachs, percentage, judgement, overdue, score, urgent, difficult, finishTime, punish, approver, timeApproved,
                    valueApproved, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedUsers, openedStatus, flags, flagsRemoves, lastLogID, bizfullname, isAddSignature, isOpenBidding,
                    companyOfUser: company._id, milestone, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: update status mutiple
	 * type: 1-Việc con/ 2- checklist
	 */
    updateStatusMutiple: {
        auth: "required",
        params: {
            taskIDs         : { type: "array" },
            parentID        : { type: "string" },
            type            : { type: "number" }, // 1 việc con / 2 checklist
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {
                    taskIDs, parentID, type
                 } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // Bước check quyền
                let resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.updateStatusMutiple({
                    parentID, taskIDs, type, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            // Field bổ sung
            projectID           : { type: "string", optional: true },
            draft               : { type: "string", optional: true },
            type                : { type: "string", optional: true },
            level               : { type: "string", optional: true },
            status              : { type: "string", optional: true },
            typeStatus          : { type: "string", optional: true },
            taskID              : { type: "string", optional: true },
            collection          : { type: "string", optional: true },
            assigneeID          : { type: "string", optional: true },
            authorID            : { type: "string", optional: true },
            subtype             : { type: "string", optional: true },
            isExpired           : { type: "string", optional: true },
            fromDate            : { type: "string", optional: true },
            toDate              : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            companyOfAuthor     : { type: "string", optional: true },
            companyOfAssignee   : { type: "string", optional: true },
            fieldID             : { type: "string", optional: true },
            isSortChecklist     : { type: "string", optional: true },
            isChecklist         : { type: "string", optional: true },
            isChildTask         : { type: "string", optional: true },
            isSortChildTask     : { type: "string", optional: true },
            isStatusNot3        : { type: "string", optional: true },
            isUsersDelete       : { type: "string", optional: true },
            statusNe            : { type: "string", optional: true },
            groupID             : { type: "string", optional: true },
            isPassPermision     : { type: "string", optional: true },
            milestone           : { type: "string", optional: true },
            sortKey             : { type: "string", optional: true },

            // Field mặc định
            keyword             : { type: "string", optional: true },
            limit               : { type: "string", optional: true },
            lastestID           : { type: "string", optional: true },
            select              : { type: "string", optional: true },
            populates           : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                let {
                    taskID, projectID, status, draft, type, level, typeStatus, collection, assigneeID, authorID, subtype, isExpired, isStatusNot3, isUsersDelete, isChildTask, isSortChildTask,
                    fromDate, toDate, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist, isChecklist, statusNe, groupID, sortKey,
                    keyword, limit, lastestID, select, populates, isPassPermision, milestone
                } = ctx.params;

				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                // Trường hợp nếu có taskID thì gọi function lấy chi tiết task, ngược lại gọi function lấy danh sách task
                if(taskID){
                    resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getInfo({
                        taskID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getList({
                        userID, projectID, status, draft, type, level, typeStatus, collection, assigneeID, authorID, subtype, statusNe, groupID, sortKey,
                        isExpired, fromDate, toDate, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist, isChecklist, isStatusNot3, isUsersDelete, isChildTask, isSortChildTask,
                        keyword, limit, select, lastestID, populates, isPassPermision, milestone
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: MinhVH
     * Func: Search Task
     * Date: 11/05/2022
     */
    getListByFilter: {
        auth: 'required',
        params: {
            fromDate            : { type: 'string', optional: true },
            toDate              : { type: 'string', optional: true },
            assigneesID         : { type: 'array', optional: true },
            companiesOfAssignee : { type: 'array', optional: true },
            authorsID           : { type: 'array', optional: true },
            projectsID          : { type: 'array', optional: true },
            subtypes            : { type: 'array', optional: true },
            status              : { type: 'array', optional: true },
            fieldsID            : { type: 'array', optional: true },
            isExpired           : { type: 'number', optional: true },

            keyword             : { type: "string", optional: true },
            limit               : { type: "number", optional: true },
            lastestID           : { type: "string", optional: true },
            select              : { type: "string", optional: true },
            populates           : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const {
                    fromDate, toDate, assigneesID, companiesOfAssignee, authorsID,
                    projectsID, subtypes, status, fieldsID, isExpired, keyword,
                    limit, lastestID, select, populates
                } = ctx.params;

                const resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getListByFilter({
                    fromDate, toDate, assigneesID, companiesOfAssignee, authorsID,
                    projectsID, subtypes, status, fieldsID, isExpired, keyword,
                    limit, lastestID, select, populates, userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
	 * Dev: Depv
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
                let resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getAmountTask({ userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Lấy số lượng công việc đấu thầu
	 */
    getBadgeBidding: {
        auth: "required",
        params: {},
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                // Bước check quyền
                let resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getBadgeBidding({ userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Gửi email trong task
     * Updated: MinhVH - 12/05/2022
	 */
    sendEmailToMembersInTask: {
        auth: "required",
        params: {
            taskID   : { type: "string" },
            title    : { type: "string" },
            notice   : { type: "string" },
            members  : { type: "array" },
            emails   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, email, fullname } = ctx.meta.infoUser;
                const { taskID, title, notice, members, emails } = ctx.params;

                const resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.sendEmailToMembersInTask({
                    taskID, title, notice, emails,
                    sender: { email, fullname }, receivers: members, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Lấy số lượng công việc của companyOfAssignee trong dự án
	 */
    getAmountTaskOfCompanyOfAssignee: {
        auth: "required",
        params: {
            projectID: { type: "string" },
            keyword: { type: "string", optional: true },
            subtype: { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                let { projectID, keyword, subtype } = ctx.params;
                let resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getAmountTaskOfCompanyOfAssigneeV2({ projectID, keyword, subtype, ctx });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


     /**
	 * Dev: Depv
	 * Func: Lấy số lượng công việc của companyOfAuthor trong dự án
	 */
    getAmountTaskOfCompanyOfAuthor: {
        auth: "required",
        params: {
            projectID: { type: "string" },
            keyword: { type: "string", optional: true },
            subtype: { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                let { projectID, keyword, subtype } = ctx.params;
                let resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getAmountTaskOfCompanyOfAuthor({ projectID, keyword, subtype, ctx });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
	 * Dev: Depv
	 * Func: Lấy số lượng công việc của companyOfAssignee trong dự án theo milestone
	 */
    getAmountTaskOfMilestone: {
        auth: "required",
        params: {
            projectID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                let { projectID } = ctx.params;
                let resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getAmountTaskByMilestone({ projectID, ctx });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Lấy số lượng công việc của tất cả project mà user là members
	 */
    getAmountTaskByProjects: {
        auth: "required",
        params: {
            fromDate: { type: "string", optional: true },
            toDate:   { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                let { fromDate, toDate } = ctx.params;
                let resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.getAmountTaskByProjects({ userID, fromDate, toDate, ctx });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Di chuyển công việc đến việc cha
     * Date: 22/04/2022
	 */
    moveTaskToParent: {
        auth: "required",
        params: {
            parentID    : { type: "string" },
            taskID      : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const { parentID, taskID } = ctx.params;

                const resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.moveTaskToParent({
                    parentID, taskID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Di chuyển công việc đến nhóm dữ liệu khác (trong cùng dự án)
     * Date: 22/04/2022
	 */
    moveTaskToGroup: {
        auth: "required",
        params: {
            groupID    : { type: "string" },
            taskID     : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const { groupID, taskID } = ctx.params;

                const resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.moveTaskToGroup({
                    groupID, taskID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: MinhVH
     * Func: Copy công việc
     * Date: 22/04/2022
     */
    copyTask: {
        auth: 'required',
        params: {
            taskID: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, company } = ctx.meta.infoUser;
                const { taskID } = ctx.params;

                const resultAfterCallHandler = await PCM_PLAN_TASK_MODEL.copyTask({
                    taskID, userID, companyOfUser: company._id
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}