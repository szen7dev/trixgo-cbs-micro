/**
 * Dev: HuynhVinh
 * Updated: MinhVH
 */ 
exports.renderStatusCodeAndResponse = function ({ resultAfterCallHandler, ctx, error_message }) {
    let error = [];

    if(resultAfterCallHandler && resultAfterCallHandler.error){
        error = [{
            message: resultAfterCallHandler.message,
            keyError: 'result_after_call_handler'
        }]
    }

    if(!ctx){
        error = [...error, {
            message: 'error_render_status_code_miss_ctx',
            keyError: 'ctx'
        }]
    }

    if(ctx && !ctx.meta){
        error = [...error, {
            message: 'error_render_status_code_miss_ctx.meta',
            keyError: 'ctx.meta'
        }]
    }

	if(error_message){
		error = [...error, {
            message: error_message,
            keyError: 'error_message'
        }]
	}

    if(error.length){
        ctx.meta.$statusCode    = resultAfterCallHandler && resultAfterCallHandler.status || 500;
        ctx.meta.$statusMessage = 'server_error';

		return { error: true, data: error };
    }

    ctx.meta.$statusCode    = 200;
    ctx.meta.$statusMessage = resultAfterCallHandler.message || 'success';

	return resultAfterCallHandler;
};
