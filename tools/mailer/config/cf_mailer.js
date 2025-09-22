"use strict";

module.exports = {
    supportMail: "no-reply@trixgo.com",

    email: process.env.MAILER_SENDER || '...',
    pass:  process.env.MAILER_PWD    || '...',
    siteName: 'https://app.trixgo.com/',
    password: process.env.MAILER_PWD || '...',

    host: process.env.MAILER_HOST || 'smtp.gmail.com',
    port: process.env.MAILER_PORT || '587',
    service: 'Gmail',
    opts: process.env.MAILER_OPS_DISABLED ? null : {
        host: process.env.MAILER_HOST || 'smtp.gmail.com',
        port: process.env.MAILER_PORT || 587,
        secure: process.env.MAILER_SECURE || false, // true for 465, false for other ports
        auth: {
            user: process.env.MAILER_LOGIN_ID || process.env.MAILER_SENDER,
            pass: process.env.MAILER_PWD,
        },
    },
};