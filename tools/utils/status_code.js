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

	if(error_message){
		error = {
            data: {
                message: error_message,
                keyError: 'server_error'
            }
        }
	}

    if(Object.keys(error).length){
        ctx.meta.$statusCode    = (resultAfterCallHandler && resultAfterCallHandler.status) ? resultAfterCallHandler.status : 200;
        ctx.meta.$statusMessage = 'server_error';

		return { error: true, status: ctx.meta.$statusCode, ...error };
    }

    ctx.meta.$statusCode    = 200;
    ctx.meta.$statusMessage = resultAfterCallHandler?.message ?? 'success';

	return resultAfterCallHandler;
};