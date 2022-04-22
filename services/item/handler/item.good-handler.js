/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__GOODS_MODEL                    = require('../model/item.good-model').MODEL;

module.exports = {

     /**
     * Dev: Depv ✅
     * Func: Thêm goods
     */
    insert:{
        params: {
            name          : { type: "string" },
            description   : { type: "string", optional: true },
            parentID      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, company } = ctx.meta.infoUser;
                const { name, description, parentID } = ctx.params;
                const resultAfterCallHandler = await ITEM__GOODS_MODEL.insert({ companyID: company._id, parentID, name, description, userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },

    /**
     * Dev: Depv ✅
     * Func: Cập nhật goods
     */
    update:{  
        params: {
            goodsID       : { type: "string" }, 
            name          : { type: "string", optional: true },
            description   : { type: "string", optional: true },
            parentID      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, company } = ctx.meta.infoUser;
                const { goodsID, name, description } = ctx.params;
                const resultAfterCallHandler = await ITEM__GOODS_MODEL.update({ goodsID, name, description, userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },

    /**
	 * Dev: Depv 
	 * Func: Danh sách goods
	 */
    getInfoAndGetList: {
        params: {
            goodsID         : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            parentID        : { type: "string", optional: true },
            isListParentOfListChilds: { type: "string", optional: true },
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
                let { goodsID, companyID, keyword, limit, lastestID, select, populates, parentID, isListParentOfListChilds } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }
                
                let resultAfterCallHandler;
                if(goodsID){
                    resultAfterCallHandler = await ITEM__GOODS_MODEL.getInfo({
                        goodsID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__GOODS_MODEL.getList({
                        companyID, lastestID, keyword, select, limit, populates, parentID, isListParentOfListChilds
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}