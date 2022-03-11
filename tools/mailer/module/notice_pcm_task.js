"use strict";

let mailer              = require('../mailer');
let { infoTaskContent } = require('./template/content_info_task');

/**
 * @param email
 * @param title
 * @param content
 */
exports.sendNoticeToMember = function (stringify){
    try {
        let { email, title, content } = stringify;  // convert for worker_threads

        // Nội dung email
        let emailContent = infoTaskContent({ content });

        /**
         * Gửi email
         * - Người nhận
         * - Tiêu đề
         * - Nội dung
         */
        mailer(email, `${title.toUpperCase()}_TRIXGO.COM_${Date.now()}`, emailContent, function(cb){
            console.log(cb);
        });
    } catch (error) {
        console.error(error);
    }
}