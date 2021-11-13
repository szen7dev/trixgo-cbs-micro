/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const TRAINING__SUBJECT_MODEL             = require('../model/training.subject-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: insert subject
	 */
    insert: {
        auth: "required",
        params: {
            type              : { type: "string", optional: true },
            name              : { type: "string", optional: true },
            description       : { type: "string", optional: true },
            content           : { type: "string", optional: true },
            parent            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { type, name, description, content, parent } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await TRAINING__SUBJECT_MODEL.insert({
                        type, name, description, content, parent, userID
                    });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: update subject
	 */
    update: {
        auth: "required",
        params: {
            subjectID         : { type: "string" },
            name              : { type: "string", optional: true },
            description       : { type: "string", optional: true },
            content           : { type: "string", optional: true },
            logo              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { subjectID, name, description, content, logo } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // Bước check quyền
                let resultAfterCallHandler = await TRAINING__SUBJECT_MODEL.update({
                    subjectID, name, logo, description, content, userID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
	 * Dev: Depv ✅
	 * Func: remove subject
	 */
    remove: {
        auth: "required",
        params: {
            subjectID         : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { subjectID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // Bước check quyền

                let resultAfterCallHandler = await TRAINING__SUBJECT_MODEL.remove({
                    subjectID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: getList and getInfo subject
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            type        : { type: "string", optional: true },
            parentID    : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            subjectID   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { subjectID, keyword, limit, lastestID, type, parentID, filter, select } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler;
                if(subjectID){
                    resultAfterCallHandler = await TRAINING__SUBJECT_MODEL.getInfo({
                        subjectID, select, userID
                    });
                }else{
                    resultAfterCallHandler = await TRAINING__SUBJECT_MODEL.getList({
                        keyword, limit, lastestID, type, parentID, filter, select
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}