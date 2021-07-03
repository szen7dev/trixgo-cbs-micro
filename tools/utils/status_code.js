exports.renderStatusCode = function ({resultAfterCallHandler, ctx }) {
    if(!resultAfterCallHandler){
        let error = {
            message: 'error_render_satus_code_miss_resultAfterCallHandler',
            keyError : 'resultAfterCallHandler'
        }
        console.log(error);
        return
    }
    if(!ctx){
        let error = {
            message: 'error_render_satus_code_miss_ctx',
            keyError : 'ctx'
        }
        console.log(error);
        return
    }

    if(ctx && !ctx.meta){
        let error = {
            message: 'error_render_satus_code_miss_ctx.meta',
            keyError : 'ctx.meta'
        }
        console.log(error);
        return
    }

    ctx.meta.$statusCode    = resultAfterCallHandler.status || 500 ;
    ctx.meta.$statusMessage = resultAfterCallHandler.message || 'success';

};