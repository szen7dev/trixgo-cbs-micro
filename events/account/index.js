    module.exports = {
    demo : {
        // Validation schema with shorthand notation
        // params: {
        //     subject: "string"
        // },
        async handler(ctx) {
            try {
                this.logger.info("Something happened", ctx.params);
                console.log('HELLOOOO');
            } catch (error) {
                return(error);
            }
        },
    } ,
    
} 
