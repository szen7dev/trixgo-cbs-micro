/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { OPTION_SELLERS }                        = require('../../item/helper/item.keys-constant')

/**
 * MODELS
 */
const ITEM__CONFIG_MODEL                    = require('../model/item.config-model').MODEL;

module.exports = {
    /**
     * Name: Insert ✅
	 * Author : Hiepnh
	 * Date: 03/5/2022
	 */
     insert:{
        auth: "required",
        params: {
            name          : { type: "string" },
            type          : { type: "number", optional: true },
            active        : { type: "number", optional: true  },
            channel       : { type: "string", optional: true },
            template      : { type: "string", optional: true },
            secretKey     : { type: "string", optional: true },
            tokenKey      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company  } = ctx.meta.infoUser;
                const { optionSeller, name, type, active, channel, template, secretKey, tokenKey, metadata, hotline1, hotline2, hotline3, qrcode1, qrcode2, youtube, facebook, zalo } = ctx.params;

                console.log(ctx.params)

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }

                const resultAfterCallHandler = await ITEM__CONFIG_MODEL.insert({ companyID, userID, name, type, active, channel, template, secretKey, tokenKey, metadata, hotline1, hotline2, hotline3, qrcode1, qrcode2, youtube, facebook, zalo });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },

    /**
     * Name: Update ✅
	 * Author : Hiepnh
	 * Date: 03/5/2022
	 */
    update:{  
        auth: "required",
        params: {
            configID      : { type: "string" }, 
            name          : { type: "string", optional: true },
            type          : { type: "number", optional: true },
            active        : { type: "number", optional: true },
            channel       : { type: "string", optional: true },
            template      : { type: "string", optional: true },
            secretKey     : { type: "string", optional: true },
            tokenKey      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { configID, name, type, active, channel, template, secretKey, tokenKey, metadata, hotline1, hotline2, hotline3, qrcode1, qrcode2, youtube, facebook, zalo } = ctx.params;

                console.log(ctx.params)

                const resultAfterCallHandler = await ITEM__CONFIG_MODEL.update({ userID, configID, name, type, active, channel, template, secretKey, tokenKey, metadata, hotline1, hotline2, hotline3, qrcode1, qrcode2, youtube, facebook, zalo });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },
    
    /**
	 * Dev: HiepNH 
	 * Func: Danh sách area
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            configID          : { type: "string", optional: true },
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
                let { optionSeller, configID, type, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let companyID
                if(optionSeller){
                    companyID = OPTION_SELLERS[Number(optionSeller) - 1].company
                }else{
                    companyID = company?._id
                }
                
                let resultAfterCallHandler;
                if(configID || (companyID && type)){
                    resultAfterCallHandler = await ITEM__CONFIG_MODEL.getInfo({
                        configID, companyID, type, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__CONFIG_MODEL.getList({
                        companyID, lastestID, keyword, select, limit, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}