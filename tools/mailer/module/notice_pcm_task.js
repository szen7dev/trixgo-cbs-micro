"use strict";

// Legacy mailer for fallback
let mailer = require("../mailer");
let { infoTaskContent } = require("./template/content_info_task");

// New SendGrid integration
const { sendDynamicTemplateMail } = require("../sendgrid_mailer");
const {
  generateCompleteEmailData,
} = require("../templates/pcm/task_notification");

/**
 * Send PCM task notification using SendGrid dynamic templates
 * @param {Object} stringify - Stringified parameters from worker_threads
 * @param {string} stringify.email - Recipient email
 * @param {string} stringify.title - Email title/subject
 * @param {Object} stringify.content - Task content with sender, notice, and infoTask
 * @param {Array} stringify.comments - Array of comments
 * @param {Object} options - Additional options
 * @param {boolean} options.useLegacy - Force use of legacy mailer
 * @returns {Promise} Resolves with email result
 */
exports.sendNoticeToMember = function (stringify, options = {}) {
  return new Promise(async (resolve) => {
    try {
      let { recipientEmails, email, title, content, comments } = stringify;

      // Normalize email recipients - handle both single email and array
      let normalizedEmails = [];
      if (recipientEmails) {
        normalizedEmails = Array.isArray(recipientEmails)
          ? recipientEmails
          : [recipientEmails];
      } else if (email) {
        normalizedEmails = Array.isArray(email) ? email : [email];
      }

      // Validate email addresses
      const validEmails = normalizedEmails.filter((emailAddr) => {
        return (
          emailAddr &&
          typeof emailAddr === "string" &&
          emailAddr.trim() !== "" &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddr.trim())
        );
      });

      if (validEmails.length === 0) {
        throw new Error("No valid recipient email addresses provided");
      }

      // Check if SendGrid is configured and not forced to use legacy
      const useSendGrid =
        !options.useLegacy &&
        process.env.SENDGRID_API_KEY &&
        process.env.SENDGRID_TEMPLATE_PCM_TASK;
      console.log({ useSendGrid, k: process.env.SENDGRID_API_KEY, sender: process.env.SENDGRID_SENDER_EMAIL });

      if (useSendGrid) {
        try {
          // Generate SendGrid email data
          const emailData = generateCompleteEmailData(
            { content, comments },
            validEmails,
            {
              customSubject: title
                ? `${title.toUpperCase()}_TRIXGO.COM`
                : undefined,
              trackingEnabled: true,
              categories: ["pcm", "task_notification", "production"],
            }
          );
          console.log({ emailData });

          // Send via SendGrid - Fix: Pass parameters separately
          const result = await sendDynamicTemplateMail(
            emailData.to,
            emailData.template_id,
            emailData.dynamic_template_data,
            {
              categories: emailData.categories,
              customArgs: emailData.custom_args,
            }
          );

          console.log("PCM task notification sent via SendGrid:", {
            messageId: result.messageId,
            recipients: validEmails,
            taskId: content.infoTask._id || content.infoTask.id,
            result: JSON.stringify(result),
            errors: result.details?.['errors'],
            validationErrors: result.validation_errors
          });

          resolve(result);
          return;
        } catch (sendGridError) {
          console.error(
            "SendGrid failed, falling back to legacy mailer:",
            sendGridError
          );
          // Fall through to legacy mailer
        }
      }

      // Legacy mailer fallback - use first valid email
      console.log("Using legacy mailer for PCM task notification");

      // Generate legacy email content
      let emailContent = infoTaskContent({ content, comments });

      /**
       * Send email via legacy mailer
       * - Recipient
       * - Subject
       * - Content
       */
      mailer(
        validEmails[0], // Use first valid email for legacy mailer
        `${title.toUpperCase()}_TRIXGO.COM_${Date.now()}`,
        emailContent,
        resolve
      );
    } catch (error) {
      console.error("Error in sendNoticeToMember:", error);
      resolve({ error: error.message });
    }
  });
};

/**
 * Send PCM task notification using only SendGrid (no fallback)
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email
 * @param {string} params.title - Email title
 * @param {Object} params.content - Task content
 * @param {Array} params.comments - Comments array
 * @param {Object} options - Additional options
 * @returns {Promise} Resolves with SendGrid result
 */
exports.sendNoticeToMemberSendGrid = async function (params, options = {}) {
  try {
    const { email, title, content, comments } = params;

    // Validate required parameters
    if (!email || !content || !content.infoTask) {
      throw new Error(
        "Missing required parameters: email, content, or content.infoTask"
      );
    }

    // Normalize and validate email
    const normalizedEmails = Array.isArray(email) ? email : [email];
    const validEmails = normalizedEmails.filter((emailAddr) => {
      return (
        emailAddr &&
        typeof emailAddr === "string" &&
        emailAddr.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddr.trim())
      );
    });

    if (validEmails.length === 0) {
      throw new Error("No valid recipient email addresses provided");
    }

    // Generate SendGrid email data
    const emailData = generateCompleteEmailData(
      { content, comments },
      validEmails,
      {
        customSubject: title ? `${title.toUpperCase()}_TRIXGO.COM` : undefined,
        trackingEnabled: true,
        categories: ["pcm", "task_notification", "sendgrid_only"],
        ...options,
      }
    );

    // Send via SendGrid
    const result = await sendDynamicTemplateMail(emailData);

    console.log("PCM task notification sent via SendGrid (direct):", {
      messageId: result.messageId,
      recipients: validEmails,
      taskId: content.infoTask._id || content.infoTask.id,
    });

    return result;
  } catch (error) {
    console.error("Error in sendNoticeToMemberSendGrid:", error);
    throw error;
  }
};

/**
 * Send PCM task notification using only legacy mailer
 * @param {Object} stringify - Stringified parameters
 * @returns {Promise} Resolves with legacy mailer result
 */
exports.sendNoticeToMemberLegacy = function (stringify) {
  return new Promise((resolve) => {
    try {
      let { email, title, content, comments } = stringify;

      // Generate legacy email content
      let emailContent = infoTaskContent({ content, comments });

      // Send via legacy mailer
      mailer(
        email,
        `${title.toUpperCase()}_TRIXGO.COM_${Date.now()}`,
        emailContent,
        resolve
      );
    } catch (error) {
      console.error("Error in sendNoticeToMemberLegacy:", error);
      resolve({ error: error.message });
    }
  });
};
