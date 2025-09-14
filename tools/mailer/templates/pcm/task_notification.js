"use strict";

const { buildTemplateData } = require("../utils/template_builder");
const { nl2p, formatTextForHTML } = require("../utils/data_formatter");
const moment = require("moment");

/**
 * PCM Task Notification Template
 * Generates template data for SendGrid dynamic templates
 * Based on the original content_info_task.js functionality
 */

/**
 * Generate PCM task notification template data
 * @param {Object} params - Template parameters
 * @param {Object} params.content - Task content with sender, notice, and infoTask
 * @param {Array} params.comments - Array of comments
 * @param {Object} options - Additional options
 * @returns {Object} Template data for SendGrid
 */
function generateTaskNotificationData(
  { content, comments = [] },
  options = {}
) {
  try {
    // Validate required data
    if (!content || !content.infoTask) {
      throw new Error("Missing required task information");
    }

    // Build base template data using template builder
    const templateData = buildTemplateData(
      "PCM_TASK_NOTIFICATION",
      {
        sender: content.sender,
        notice: content.notice,
        infoTask: content.infoTask,
        comments: comments,
      },
      options
    );

    // Add additional PCM-specific data
    const enhancedData = {
      ...templateData,
      // Email subject
      subject: generateEmailSubject(content.infoTask, content.notice),
      // Formatted notice with HTML
      formattedNotice: nl2p(content.notice || ""),
      // Task details for template
      taskDetails: formatTaskDetails(content.infoTask),
      // Formatted comments for template
      formattedComments: formatCommentsForTemplate(
        comments,
        templateData.cdn.baseUrl
      ),
      // Action buttons
      actionButtons: generateActionButtons(
        content.infoTask._id || content.infoTask.id
      ),
      // Email metadata
      emailMetadata: {
        taskId: content.infoTask._id || content.infoTask.id,
        taskName: content.infoTask.name,
        senderEmail: content.sender?.email,
        timestamp: new Date().toISOString(),
        category: "pcm_task_notification",
      },
    };

    return enhancedData;
  } catch (error) {
    console.error("Error generating task notification data:", error);
    throw error;
  }
}

/**
 * Generate email subject based on task and notice
 * @param {Object} task - Task information
 * @param {string} notice - Notice text
 * @returns {string} Email subject
 */
function generateEmailSubject(task, notice) {
  const taskName = task.name || "Task Update";
  const truncatedName =
    taskName.length > 50 ? taskName.substring(0, 47) + "..." : taskName;

  if (notice && notice.trim()) {
    return `[PCM] ${truncatedName} - ${notice.substring(0, 30)}${
      notice.length > 30 ? "..." : ""
    }`;
  }

  return `[PCM] ${truncatedName} - Task Notification`;
}

/**
 * Format task details for template display
 * @param {Object} task - Task object
 * @returns {Object} Formatted task details
 */
function formatTaskDetails(task) {
  const cdnBaseUrl =
    process.env.AWS_BUCKET_URL || "https://trixgo-main.sgp1.cdn.digitaloceanspaces.com";

  return {
    id: task._id || task.id,
    name: task.name || "Untitled Task",
    description: task.description || "",
    subtype: task.subtype || 0,
    level: task.level || 1,
    priority: task.priority || "medium",
    status: task.status || "pending",

    // Dates
    createdAt: task.createdAt
      ? moment(task.createdAt).format("DD/MM/YYYY HH:mm")
      : "",
    updatedAt: task.updatedAt
      ? moment(task.updatedAt).format("DD/MM/YYYY HH:mm")
      : "",
    dueDate: task.actualFinishTime
      ? moment(task.actualFinishTime).format("DD/MM/YYYY")
      : "",
    dueDateFull: task.actualFinishTime
      ? moment(task.actualFinishTime).format("DD/MM/YYYY HH:mm")
      : "",

    // People
    author: formatPersonInfo(task.author, cdnBaseUrl),
    assignee: formatPersonInfo(task.assignee, cdnBaseUrl),

    // Project/Department
    project: {
      id: task.project?._id || task.project?.id,
      name: task.project?.name || "Unknown Project",
      description: task.project?.description || "",
    },

    // URLs
    webUrl: `https://app.trixgo.com/pcm/detail/${task._id || task.id}`,
    mobileUrl: `https://app.trixgo.com/mobile/pcm/${task._id || task.id}`,
  };
}

/**
 * Format person information for template
 * @param {Object} person - Person object
 * @param {string} cdnBaseUrl - CDN base URL
 * @returns {Object} Formatted person info
 */
function formatPersonInfo(person, cdnBaseUrl) {
  if (!person) {
    return {
      id: null,
      fullname: "Unknown User",
      email: "",
      avatar: `${cdnBaseUrl}/files/branding/default-avatar.png`,
      initials: "UN",
    };
  }

  const fullname = person.fullname || person.name || "Unknown User";
  const initials = fullname
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return {
    id: person._id || person.id,
    fullname: fullname,
    email: person.email || "",
    avatar: person.image
      ? `${cdnBaseUrl}/files/db/users/${person.image}`
      : `${cdnBaseUrl}/files/branding/default-avatar.png`,
    initials: initials,
  };
}

/**
 * Format comments for template display
 * @param {Array} comments - Array of comments
 * @param {string} cdnBaseUrl - CDN base URL
 * @returns {Array} Formatted comments
 */
function formatCommentsForTemplate(comments, cdnBaseUrl) {
  if (!Array.isArray(comments)) return [];

  return comments.map((comment) => {
    const formattedComment = {
      id: comment._id || comment.id,
      content: formatTextForHTML(comment.content || ""),
      contentHtml: nl2p(comment.content || ""),
      author: formatPersonInfo(comment.author, cdnBaseUrl),

      // Timestamps
      createdAt: comment.createAt
        ? moment(comment.createAt).format("DD/MM/YYYY HH:mm")
        : "",
      createdAtRelative: comment.createAt
        ? moment(comment.createAt).fromNow()
        : "",
      createdAtISO: comment.createAt
        ? new Date(comment.createAt).toISOString()
        : "",

      // Recipients
      receivers: (comment.receivers || []).map((receiver) =>
        formatPersonInfo(receiver, cdnBaseUrl)
      ),
      receiversText: (comment.receivers || [])
        .map((r) => r.fullname || r.name || "Unknown")
        .join(", "),

      // Files and attachments
      files: formatAttachments(comment.files || [], cdnBaseUrl, "file"),
      images: formatAttachments(comment.images || [], cdnBaseUrl, "image"),

      // Flags
      hasFiles: (comment.files || []).length > 0,
      hasImages: (comment.images || []).length > 0,
      hasAttachments:
        (comment.files || []).length > 0 || (comment.images || []).length > 0,
    };

    return formattedComment;
  });
}

/**
 * Format attachments (files/images) for template
 * @param {Array} attachments - Array of attachments
 * @param {string} cdnBaseUrl - CDN base URL
 * @param {string} type - Attachment type ('file' or 'image')
 * @returns {Array} Formatted attachments
 */
function formatAttachments(attachments, cdnBaseUrl, type = "file") {
  if (!Array.isArray(attachments)) return [];

  return attachments.map((attachment) => ({
    id: attachment._id || attachment.id,
    name: attachment.nameOrg || attachment.name || "Unknown File",
    path: attachment.path,
    url: `${cdnBaseUrl}${attachment.path}`,
    size: attachment.size || 0,
    type: attachment.type || type,
    createdAt: attachment.createAt
      ? moment(attachment.createAt).format("DD/MM/YYYY HH:mm")
      : "",
    createdAtRelative: attachment.createAt
      ? moment(attachment.createAt).fromNow()
      : "",

    // For images, add thumbnail info
    ...(type === "image" && {
      thumbnail: `${cdnBaseUrl}${attachment.path}`,
      alt: attachment.nameOrg || attachment.name || "Image attachment",
    }),
  }));
}

/**
 * Generate action buttons for the email
 * @param {string} taskId - Task ID
 * @returns {Array} Action buttons configuration
 */
function generateActionButtons(taskId) {
  const baseUrl = process.env.APP_BASE_URL || "https://app.trixgo.com";

  return [
    {
      text: "View on Web",
      textVi: "Xem trên Web",
      url: `${baseUrl}/pcm/detail/${taskId}`,
      style: "primary",
      icon: "🌐",
    },
    {
      text: "Open in App",
      textVi: "Mở trong App",
      url: `${baseUrl}/mobile/pcm/${taskId}`,
      style: "secondary",
      icon: "📱",
    },
  ];
}

/**
 * Get task type labels based on subtype and level (from original logic)
 * @param {number} subtype - Task subtype
 * @param {number} level - Task level
 * @returns {Object} Task type labels
 */
function getTaskTypeLabels(subtype, level) {
  const subtypeNum = Number(subtype);
  const levelNum = Number(level);

  if ([0, 1, 6, 7, 8, 10, 11].includes(subtypeNum)) {
    return {
      author: "Author/Người tạo việc",
      assignee: "Assignee/Người thực hiện",
    };
  } else {
    if (subtypeNum === 4 && levelNum === 2) {
      return {
        author: "Đơn vị mời thầu",
        assignee: "Đơn vị dự thầu",
      };
    } else {
      return {
        author: "Submitter/Người đệ trình",
        assignee: "Approver/Người phê duyệt",
      };
    }
  }
}

/**
 * Generate complete email data for SendGrid
 * @param {Object} params - Template parameters
 * @param {string|Array} recipientEmails - Recipient email address(es)
 * @param {Object} options - Additional options
 * @returns {Object} Complete email data for SendGrid
 */
function generateCompleteEmailData(params, recipientEmails, options = {}) {
  // Validate and normalize recipient emails
  if (!recipientEmails) {
    throw new Error("Recipient emails are required");
  }

  const normalizedEmails = Array.isArray(recipientEmails)
    ? recipientEmails
    : [recipientEmails];

  // Validate each email address
  const validEmails = normalizedEmails.filter((email) => {
    return (
      email &&
      typeof email === "string" &&
      email.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    );
  });

  if (validEmails.length === 0) {
    throw new Error("No valid recipient email addresses provided");
  }

  const templateData = generateTaskNotificationData(params, options);
  const to = validEmails.map((email) => email.trim())

  return {
    to,
    template_id:
      process.env.SENDGRID_TEMPLATE_PCM_TASK ||
      "d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    dynamic_template_data: templateData,
    categories: ["pcm", "task_notification"],
    custom_args: {
      task_id: templateData.taskDetails.id,
      notification_type: "task_update",
      sender_id: templateData.sender?.id || "system",
    },
  };
}

module.exports = {
  generateTaskNotificationData,
  generateCompleteEmailData,
  generateEmailSubject,
  formatTaskDetails,
  formatCommentsForTemplate,
  getTaskTypeLabels,
};
