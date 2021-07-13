let FILE__CORE_MODEL                  = require('../model/file.core-model').MODEL;

module.exports = {
    insert: {
        params: {
            app            : { type: "string" },
            name           : { type: "string" },
            status         : { type: "string", optional: true },
            url            : { type: "string" },
            size           : { type: "string", optional: true },

            userID         : { type: "string" }, //TODO: fake wating AUTH_SERVICE
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { app, name, status, url, size, userID }        = ctx.params;
              
                let infoFileAfterInsert = await FILE__CORE_MODEL.insert({ app, name, status, url, size, userID });
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
                return { error:  true, message: error.message };
            }
        }
    },
}