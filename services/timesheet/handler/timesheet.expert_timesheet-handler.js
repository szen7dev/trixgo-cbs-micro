/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const TIMESHEET__EXPERT_TIMESHEET_MODEL         = require('../model/timesheet.expert_timesheet-model').MODEL;

module.exports = {

    /**
	 * Dev: HiepNH
	 * Func: Insert expert timesheet
	 */
    insert: {
        params: {
            name               : { type: "string"},
            parentID           : { type: "string", optional: true },
            date               : { type: "string", optional: true },
            type               : { type: "string", optional: true },
            note               : { type: "string", optional: true },
            projectID          : { type: "string", optional: true },
            assigneeID         : { type: "string", optional: true },
            shiftID            : { type: "string", optional: true },
            fundaID            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { parentID, name, location, device, date, type, note, hours, unitprice, projectID, assigneeID, shiftID, fundaID, subtype, shiftType, official } = ctx.params;
				console.log(ctx.params)
                
                const { _id: userID, company } = ctx.meta.infoUser;
                // console.log({company})

                let resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.insert({
                    userCreate: userID, companyID: company._id, parentID, name, location, date, type, note, hours, unitprice, projectID, assigneeID, shiftID, fundaID, subtype, shiftType, official, device
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: HiepNH
	 * Func: Update expert timesheet
	 */
    update: {
        params: {
            expertTimesheetID       : { type: "string" },
            projectID               : { type: "string", optional: true },
            name                    : { type: "string", optional: true },
            date                    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { expertTimesheetID, projectID, fundaID, name, location, type, assigneeID, hours, unitprice, amount, status, approver, note, date,
                     dateIn1, dateOut1, dateIn2, dateOut2, dateIn3, dateOut3, members, membersRemove, admins, adminsRemove, workID, subtype, shiftType, official, filesID } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.update({
                    expertTimesheetID, userID, projectID, fundaID, name, location, type, assigneeID, hours, unitprice, amount, status, approver,
                    note, date, dateIn1, dateOut1, dateIn2, dateOut2, dateIn3, dateOut3, members, membersRemove, admins, adminsRemove, workID, subtype, shiftType, official, filesID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: syncData
     * Author: HiepNH
     * Code: 22/3/2024
     */
    syncData: {
        params: {
            timesheetID : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, timesheetID, month, year } = ctx.params;
                // console.log(ctx.params)

				const { _id: userID, company, email } = ctx.meta.infoUser;

                let resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.syncData({
                    userID, companyID: company._id, option, timesheetID, month, year
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: HiepNH
	 * Func: Remove expert timesheet
	 */
    remove: {
        params: {
            expertTimesheetID : { type: "string"},
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                let { expertTimesheetID } = ctx.params;
                let resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.remove({ expertTimesheetID, ctx });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: HiepNH
	 * Func: Danh sách expert timesheet
	 */
    getInfoAndGetList: {
        params: {
            sortOption        : { type: "string", optional: true },
            expertTimesheetID : { type: "string", optional: true },
            companyID         : { type: "string", optional: true },
            projectID         : { type: "string", optional: true },
            parentID          : { type: "string", optional: true },
            workID            : { type: "string", optional: true },

            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { expertTimesheetID, companyID, parentID, projectID, keyword, limit, lastestID, select, populates, option, month, year, humanID, sortOption, workID, type, subtype, shiftType, official, typeTimesheet } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                
                // console.log({ EXPERT_TIMESHEET_PARAMS: ctx.params })

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if(expertTimesheetID){
                    resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.getInfo({
                        expertTimesheetID, userID, select, populates, ctx
                    });
                } else{
                    resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.getList({
                        sortOption, parentID, companyID, projectID, userID, keyword, limit, lastestID, select, populates, option, month, year, humanID, sortOption, workID, type, subtype, shiftType, official, typeTimesheet
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Gom nhóm theo tính chất
     * Date: 6/8/2023
     */
    getListByProperty: {
        auth: "required",
        params: {
            option              : { type: "string", optional: true  },
            year                : { type: "string", optional: true  },
            month               : { type: "string", optional: true  },
            companyID           : { type: "string", optional: true  },
            projectID           : { type: "string", optional: true  },
            assigneeID           : { type: "string", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, type, year, companyID, projectID, assigneeID, month } = ctx.params;
                // console.log(ctx.params)
                
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.getListByProperty({
                        option, type, year, month, companyID, projectID, assigneeID, userID,
                    });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    
    /**
     * Dev: HiepNH
     * Name: Download Template Excel
     * Date: 25/11/2024
     */
    exportExcel: {
        auth: 'required',
        params: {
            // companyID: { type: "string", optional: true },
            // option: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                let { year, month } = ctx.params;
                // console.log(ctx.params)

                const resultAfterCallHandler = await TIMESHEET__EXPERT_TIMESHEET_MODEL.exportExcel({
                    companyID: company._id, year, month, userID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}