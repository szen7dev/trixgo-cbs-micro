//HuynhVinh 
exports.renderStatusCode = function ({ resultAfterCallHandler, ctx }) {
    let isError = false;
    let error   = {};
    if(!resultAfterCallHandler || (resultAfterCallHandler && resultAfterCallHandler.error)){
        error = {
            message     : 'error_render_satus_code_miss_resultAfterCallHandler',
            keyError    : 'resultAfterCallHandler'
        }
        isError = true
    }

    if(!ctx){
        error = {
            message     : 'error_render_satus_code_miss_ctx',
            keyError    : 'ctx'
        }
        isError = true

    }

    if(ctx && !ctx.meta){
        error = {
            message     : 'error_render_satus_code_miss_ctx.meta',
            keyError    : 'ctx.meta'
        }
        isError = true
    }
    if(isError){
        ctx.meta.$statusCode    = resultAfterCallHandler && resultAfterCallHandler.status || 500;
        ctx.meta.$statusMessage = 'server error';
        // Log for dev
        console.log({ errorRenderStatusCode:error });
        return
    }
    // ctx.meta.$statusCode    = resultAfterCallHandler.status  || 500;
    ctx.meta.$statusCode    = 200;
    ctx.meta.$statusMessage = resultAfterCallHandler.message || 'success';

};