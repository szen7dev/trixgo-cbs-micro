/**
 * Dev: HuynhVinh
 * Updated: MinhVH
 */ 
exports.renderStatusCodeAndResponse = function ({ resultAfterCallHandler, ctx, error_message }) {
    let errors = [];

    if(resultAfterCallHandler && resultAfterCallHandler.error){
        errors = [{
            message: resultAfterCallHandler.message,
            keyError: resultAfterCallHandler.keyError || 'result_after_call_handler'
        }]
    }

    if(!ctx){
        errors = [...errors, {
            message: 'error_render_status_code_miss_ctx',
            keyError: 'ctx'
        }]
    }

    if(ctx && !ctx.meta){
        errors = [...errors, {
            message: 'error_render_status_code_miss_ctx.meta',
            keyError: 'ctx.meta'
        }]
    }

	if(error_message){
		errors = [...errors, {
            message: error_message,
            keyError: 'server_error'
        }]
	}

    if(errors.length){
        ctx.meta.$statusCode    = resultAfterCallHandler ? resultAfterCallHandler.status : 500;
        ctx.meta.$statusMessage = 'server_error';

		return { error: true, status: ctx.meta.$statusCode, data: errors };
    }

    ctx.meta.$statusCode    = 200;
    ctx.meta.$statusMessage = resultAfterCallHandler.message || 'success';

	return resultAfterCallHandler;
};
