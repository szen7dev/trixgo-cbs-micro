module.exports = {
    checkHealth: {
        async handler(ctx) {
            try {
                console.log(ctx);
                return {
                   error: false, message: 'healthy'
                }
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    checkVersion: {
        async handler(ctx) {
            try {
                try {
                    return {
                       error: false, data: {
                           currentVersion: 'non version /api' 
                       }
                    }
                } catch (error) {
                    return { error:  true, message: error.message };
                }
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}