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
     * Name: Thêm
     * Author: HiepNH
     * Code: 2/10/2022
     */
    insertDoc: {
        auth: "required",
        params: {
            contractID  : { type: "string" },
			areaID      : { type: "string" },
			groupID     : { type: "string" },
            assigneeID  : { type: "string" },
            name        : { type: "string" },
            expiredTime : { type: "string" },
            sign        : { type: "string", optional: true },
            templateID  : { type: "string", optional: true },
            related     : { type: "array", optional: true },
            description : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { contractID, areaID, groupID, sign, templateID, assigneeID, related, name, expiredTime, description } = ctx.params;
                // console.log({contractID, areaID, groupID, sign, templateID, assigneeID, related, name, expiredTime, description})

                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.insert({
					contractID, areaID, groupID, sign, templateID, assigneeID, related, name, expiredTime, description, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Name: Cập nhật
     * Author: HiepNH
     * Code: 2/10/2022
     */
    updateDoc: {
        auth: "required",
        params: {
            docID       : { type: "string" },
            assigneeID  : { type: "string", optional: true },
            sign        : { type: "string", optional: true },
            templateID  : { type: "string", optional: true },
            related     : { type: "array" , optional: true },
            name        : { type: "string" },
            expiredTime : { type: "string", optional: true },
            description : { type: "string", optional: true },
            status      : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {          
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { docID, sign, templateID, assigneeID, name, expiredTime, description, status, related } = ctx.params;

                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.update({
					docID, sign, templateID, assigneeID, name, expiredTime, description, status, related, userID 
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Name: Xóa
     * Author: HiepNH
     * Code: 2/10/2022
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
     * Name: Lấy thông tin + Danh sách
     * Author: HiepNH
     * Code: 2/10/2022
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