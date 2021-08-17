module.exports = {
    getList: {
        params: {
            page            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { page }        = ctx.params;
                return { 
                    error: false, page: page, message: 'reaction'
                }
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}