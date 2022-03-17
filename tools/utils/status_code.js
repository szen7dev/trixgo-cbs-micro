/**
 * Dev: HuynhVinh
 * Updated: MinhVH
 */
exports.renderStatusCodeAndResponse = function ({ resultAfterCallHandler, ctx, error_message }) {
    let error = {};

    if(resultAfterCallHandler && resultAfterCallHandler.error){
        error = {
            data: {
                message: resultAfterCallHandler.message,
                keyError: resultAfterCallHandler.keyError || 'result_after_call_handler'
            }
        }
    }

    // if(!ctx){
    //     errors = [...errors, {
    //         message: 'error_render_status_code_miss_ctx',
    //         keyError: 'ctx'
    //     }]
    // }

    // if(ctx && !ctx.meta){
    //     errors = [...errors, {
    //         message: 'error_render_status_code_miss_ctx.meta',
    //         keyError: 'ctx.meta'
    //     }]
    // }

	if(error_message){
		error = {
            data: {
                message: error_message,
                keyError: 'server_error'
            }
        }
	}

    if(Object.keys(error).length){
        ctx.meta.$statusCode    = (resultAfterCallHandler && resultAfterCallHandler.status) ? resultAfterCallHandler.status : 500;
        ctx.meta.$statusMessage = 'server_error';

		return { error: true, status: ctx.meta.$statusCode, ...error };
    }

    ctx.meta.$statusCode    = 200;
    ctx.meta.$statusMessage = resultAfterCallHandler?.message ?? 'success';

	return resultAfterCallHandler;
};