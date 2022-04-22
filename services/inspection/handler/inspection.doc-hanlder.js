/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const INSPECTION_DOC_MODEL                   = require('../model/inspection.doc-model').MODEL;

module.exports = {
    /**
	 * Dev: HiepNH 
	 * Func: Thêm template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    insertDoc: {
        auth: "required",
        params: {
            projectID   : { type: "string" },
			contractID  : { type: "string" },
            sign        : { type: "string" },
            template    : { type: "string" },
            assignee    : { type: "string" },
            members     : { type: "array", option: true },
            name        : { type: "string" },
            expiredTime : { type: "string" },
            job         : { type: "string" },
            areas       : { type: "array"  },
            description : { type: "string" ,optional: true  },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { projectID, contractID, sign, template, assignee, members, name, expiredTime, job, areas, description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.insert({
					projectID, contractID, sign, template, assignee, members, name, expiredTime, job, areas, description, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Cập nhật template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    updateDoc: {
        auth: "required",
        params: {
            docID       : { type: "string" },
            sign        : { type: "string", optional: true },
            template    : { type: "string", optional: true },
            members     : { type: "array" , optional: true },
            name        : { type: "string", optional: true },
            expiredTime : { type: "string", optional: true },
            job         : { type: "string", optional: true },
            areas       : { type: "array" , optional: true },
            description : { type: "string", optional: true },
            status      : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {          
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { docID, sign, template, assignee, members, name, expiredTime, job, areas, description, status } = ctx.params;

                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.update({
					docID, sign, template, assignee, members, name, expiredTime, job, areas, description, status, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ❌
	 * Func: Cập nhật template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    removeDoc: {
        auth: "required",
        params: {
			docID : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { docID } = ctx.params;
                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.remove({
					docID 
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Func: Danh sách template hồ sơ/biên bản 
	 * Author: Depv 
	 * Date: 17/08/2021
	 */
    getList: {
        params: {
            projectID   : { type: "string", optional: true },
            contractID  : { type: "string", optional: true },
            docID       : { type: "string", optional: true },
            assignee    : { type: "string", optional: true },
            author      : { type: "string", optional: true },
            contract    : { type: "string", optional: true },
            signature   : { type: "string", optional: true },
            area        : { type: "string", optional: true },
            fromDate    : { type: "string", optional: true },
            toDate      : { type: "string", optional: true },
            fromCreateAt: { type: "string", optional: true },
            toCreateAt  : { type: "string", optional: true },
            //_____________THÔNG SỐ MẶC ĐỊNH________________
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                let { limit, lastestID, select, filter, projectID, contractID, docID, assignee, author, signature, fromDate, toDate, fromCreateAt, toCreateAt, area  } = ctx.params;
                let resultAfterCallHandler;
                
                if(docID){
                    resultAfterCallHandler = await INSPECTION_DOC_MODEL.getInfo({
                        docID, select
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION_DOC_MODEL.getList({
                        limit,lastestID, select, filter, projectID, contractID, select, assignee, author, signature, area, userID,  fromDate, toDate, fromCreateAt, toCreateAt
                    });
                }
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}