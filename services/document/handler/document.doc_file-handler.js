/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const DOCUMENT__DOC_FILE_MODEL                   = require('../model/document.doc_file-model').MODEL;

module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 DOC FILE  	   ===============================
	 * ============================ ****************** ===============================
	 */

    /**
	 * Dev: Depv
	 * Func: Danh sách và chi tiết doc file
	 * Date: 27/10/2021
	 */
    insert: {
        params: {
			documentID   : { type: "string" },
			fileID       : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentID, fileID } = ctx.params;
                let resultAfterCallHandler = await DOCUMENT__DOC_FILE_MODEL.insert({
                    documentID, fileID, userID
                });
          
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Xóa doc file
	 * Date: 27/10/2021
	 */
    remove: {
        params: {
			docFileID      : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { docFileID } = ctx.params;

                let resultAfterCallHandler = await DOCUMENT__DOC_FILE_MODEL.delete({
                    docFileID 
                });
          
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Danh sách vaf chi tiết doc file
	 * Date: 27/10/2021
	 */
    getInfoAndGetList: {
        params: {
			documentID    : { type: "string", optional: true },
			docFileID       : { type: "string", optional: true },
            // =========================
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { docFileID, documentID, keyword, select, lastestID, populates } = ctx.params;
                let resultAfterCallHandler;
                
                if(docFileID){
                    resultAfterCallHandler = await DOCUMENT__DOC_FILE_MODEL.getInfo({
                        docFileID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await DOCUMENT__DOC_FILE_MODEL.getList({
                        documentID, userID, lastestID, keyword, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
