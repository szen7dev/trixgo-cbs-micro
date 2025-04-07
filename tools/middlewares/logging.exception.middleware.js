"use strict";

const winston = require("winston");
const { format } = winston;

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "api-gateway" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

module.exports = {
  name: "LoggingAndExceptionHandler",

  // Middleware hooks
  hooks: {
    before: {
      "*": [
        // Request logging
        async function (ctx) {
          const req = ctx.meta.$req;
          if (req) {
            const logData = {
              timestamp: new Date().toISOString(),
              method: req.method,
              url: req.url,
              headers: req.headers,
              body: req.body,
              query: req.query,
              params: ctx.params,
              userAgent: ctx.meta.userAgent,
              ipAddr: ctx.meta.ipAddr,
              platform: ctx.meta.platform,
            };

            logger.info("Incoming request", logData);
          }
        },
      ],
    },
    error: {
      "*": [
        // Global error handler
        async function (ctx, err) {
          const req = ctx.meta.$req;
          const errorResponse = {
            error: true,
            timestamp: new Date().toISOString(),
            path: req ? req.url : ctx.action.name,
            status: err.code || 500,
            message: err.message,
          };

          // Add stack trace in development
          if (process.env.NODE_ENV !== "production") {
            errorResponse.stack = err.stack;
          }

          // Log the error
          logger.error("Request error", {
            ...errorResponse,
            metadata: {
              params: ctx.params,
              user: ctx.meta.infoUser
                ? {
                    id: ctx.meta.infoUser._id,
                    username: ctx.meta.infoUser.username,
                  }
                : null,
            },
          });

          // Set response status
          if (ctx.meta.$statusCode) {
            ctx.meta.$statusCode = err.code || 500;
          }

          return errorResponse;
        },
      ],
    },
    after: {
      "*": [
        // Response logging
        async function (ctx, res) {
          const req = ctx.meta.$req;
          if (req) {
            const logData = {
              timestamp: new Date().toISOString(),
              method: req.method,
              url: req.url,
              responseTime: Date.now() - ctx.meta.$startTime,
              status: ctx.meta.$statusCode,
              response: res,
            };

            logger.info("Outgoing response", logData);
          }
          return res;
        },
      ],
    },
  },
};
