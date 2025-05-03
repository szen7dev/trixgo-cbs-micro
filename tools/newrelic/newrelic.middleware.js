"use strict";

const newrelic = require('newrelic');

module.exports = {
    name: "NewRelicMiddleware",
    
    // Called after action call
    localAction(next, action) {
        return async function newrelicMiddleware(ctx) {
            const serviceName = action.service.name;
            const actionName = action.name;
            const txnName = `${serviceName}.${actionName}`;

            return await newrelic.startSegment(`moleculer:${txnName}`, true, async () => {
                // Add custom attributes to the transaction
                newrelic.addCustomAttribute('moleculer.service', serviceName);
                newrelic.addCustomAttribute('moleculer.action', actionName);
                
                // Add metadata if available
                if (ctx.meta) {
                    if (ctx.meta.user) newrelic.addCustomAttribute('user.id', ctx.meta.user.id);
                    if (ctx.meta.reqID) newrelic.addCustomAttribute('request.id', ctx.meta.reqID);
                    if (ctx.meta.remoteIp) newrelic.addCustomAttribute('remote.ip', ctx.meta.remoteIp);
                    if (ctx.meta.userAgent) newrelic.addCustomAttribute('user.agent', ctx.meta.userAgent);
                }
                
                try {
                    // Call the original action handler
                    const result = await next(ctx);
                    return result;
                } catch (err) {
                    // Record the error in New Relic
                    newrelic.noticeError(err);
                    throw err;
                }
            });
        };
    },
    
    // Optional: Wrap remote actions as well
    remoteAction(next, action) {
        return async function newrelicRemoteMiddleware(ctx) {
            const txnName = `${ctx.action.name} [remote]`;
            
            return await newrelic.startSegment(`moleculer:remote:${txnName}`, true, async () => {
                try {
                    return await next(ctx);
                } catch (err) {
                    newrelic.noticeError(err);
                    throw err;
                }
            });
        };
    }
};