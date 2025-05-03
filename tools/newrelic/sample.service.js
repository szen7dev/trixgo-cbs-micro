"use strict";

const { trackDbOperation, trackRedisOperation, recordCustomEvent } = require('./newrelic.utils');

/**
 * Sample service showing New Relic integration
 */
module.exports = {
    name: "newrelic.example",
    
    actions: {
        /**
         * Simple example action with New Relic instrumentation
         */
        async exampleAction(ctx) {
            const { params, meta } = ctx;
            const startTime = Date.now();
            
            try {
                // Example of tracking a database operation
                const result = await trackDbOperation({
                    collection: "users",
                    operation: "find",
                    callback: async () => {
                        // Your actual database query would go here
                        return { success: true, data: { id: 1, name: "John Doe" } };
                    }
                });
                
                // Example of tracking a Redis operation
                const cacheResult = await trackRedisOperation({
                    key: "user:1",
                    operation: "get",
                    callback: async () => {
                        // Your actual Redis operation would go here
                        return { cached: true };
                    }
                });
                
                // Example of recording a custom event
                recordCustomEvent("BusinessTransaction", {
                    userId: params.userId || "anonymous",
                    actionType: "example",
                    duration: Date.now() - startTime,
                    success: true
                });
                
                return { 
                    success: true,
                    data: { 
                        ...result.data,
                        fromCache: cacheResult.cached
                    } 
                };
            } catch (error) {
                // New Relic will automatically record the error via the middleware
                // but you can add additional custom attributes if needed
                recordCustomEvent("BusinessTransaction", {
                    userId: params.userId || "anonymous",
                    actionType: "example",
                    duration: Date.now() - startTime,
                    success: false,
                    errorMessage: error.message
                });
                
                throw error;
            }
        }
    }
};