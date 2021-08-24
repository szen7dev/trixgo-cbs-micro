const uuidv4                            = require('uuid').v4;
let { GENERATE_LINK_S3 }                = require('../helper/s3');
let FILE__CORE_MODEL                    = require('../model/file.core-model').MODEL;

module.exports = {
    insert: {
        params: {
            app            : { type: "string" },
            name           : { type: "string" },
            url            : { type: "string" },
            size           : { type: "string", optional: true },

            userID         : { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { app, name, url, size, userID } = ctx.params;

                let infoFileAfterInsert = await FILE__CORE_MODEL.insert({ app, name, url, size, userID });
                return infoFileAfterInsert;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    updateStatus: {
        params: {
            fileID         : { type: "string" },
            status         : { type: "string", optional: true },

            userID         : { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fileID, status, userID }        = ctx.params;
              
                let infoFileAfterUpdate = await FILE__CORE_MODEL.updateStatus({ fileID, status, userID });
                return infoFileAfterUpdate;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    getInfoFile: {
        params: {

            userID         : { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fileID, userID }        = ctx.params;
              
                let infoFile = await FILE__CORE_MODEL.getInfoFile({ fileID, userID });
                return infoFile;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    
    getListFileWithStatus: {
        params: {
            status         : { type: "string", optional: true },

            userID         : { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { status, userID }        = ctx.params;
              
                let listFiles = await FILE__CORE_MODEL.getListFileWithStatus({ status, userID });
                return listFiles;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    generateLinkS3: {
        params: {
            type           : { type: "string" },
            app            : { type: "string", optional: true },
            size           : { type: "string", optional: true },
            isUser         : { type: "string", optional: true },
            // userID         : { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {

                let infoUser = ctx.meta.infoUser;
                let { _id: userID } = infoUser;

                await this.validateEntity(ctx.params);
                let { type, app, size, isUser }        = ctx.params;
                let fileName = uuidv4();
                //TODO kiểm tra lại fileName cần có thêm đuôi (.png, .jpg)
                let infoGenerateLink    = await GENERATE_LINK_S3(fileName, type);

                /**
                 * Nếu có app thì đang insert file trong app
                 * Nếu không có app thì đang insert trong user(image, signature)
                 */
                let infoFileAfterInsert;
                if(app){
                    let infoFileAfterInsert = await FILE__CORE_MODEL.insert({ app, name: fileName, url: ``, size, userID });
                }
                return {
                    infoGenerateLink, infoFileAfterInsert
                };
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}