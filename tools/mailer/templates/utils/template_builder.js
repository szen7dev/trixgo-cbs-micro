"use strict";

const { prepareTemplateData, formatUserInfo, formatDate, generateActionUrl } = require('../config/template_config');
const { getTemplateId, validateTemplateData } = require('../config/template_registry');

/**
 * Template Builder Utility
 * Provides functions to build and format template data for SendGrid
 */

/**
 * Build template data for SendGrid dynamic templates
 * @param {string} templateName - Template name from registry
 * @param {Object} rawData - Raw data to be formatted
 * @param {Object} options - Additional options
 * @returns {Object} Formatted template data ready for SendGrid
 */
function buildTemplateData(templateName, rawData, options = {}) {
    try {
        // Prepare base template data with validation
        const templateData = prepareTemplateData(templateName, rawData, options);
        
        // Add template-specific formatting
        switch (templateName) {
            case 'PCM_TASK_NOTIFICATION':
                return buildPCMTaskNotificationData(templateData);
            case 'PCM_PROJECT_UPDATE':
                return buildPCMProjectUpdateData(templateData);
            case 'GENERAL_NOTIFICATION':
                return buildGeneralNotificationData(templateData);
            default:
                return templateData;
        }
    } catch (error) {
        throw new Error(`Failed to build template data: ${error.message}`);
    }
}

/**
 * Build PCM Task Notification template data
 * @param {Object} data - Base template data
 * @returns {Object} Formatted PCM task notification data
 */
function buildPCMTaskNotificationData(data) {
    const { infoTask, sender, comments = [], notice } = data;
    
    // Format task information
    const formattedTask = {
        id: infoTask._id || infoTask.id,
        name: infoTask.name || 'Untitled Task',
        subtype: infoTask.subtype || 0,
        level: infoTask.level || 1,
        expired: infoTask.actualFinishTime ? formatDate(infoTask.actualFinishTime, 'short') : '',
        expiredFull: infoTask.actualFinishTime ? formatDate(infoTask.actualFinishTime, 'datetime') : '',
        author: formatUserInfo(infoTask.author),
        assignee: formatUserInfo(infoTask.assignee),
        project: {
            name: infoTask.project?.name || 'Unknown Project',
            id: infoTask.project?._id || infoTask.project?.id
        }
    };
    
    // Determine task type labels based on subtype
    const taskLabels = getTaskTypeLabels(formattedTask.subtype, formattedTask.level);
    
    // Format comments
    const formattedComments = comments.map(comment => ({
        id: comment._id || comment.id,
        content: comment.content || '',
        author: formatUserInfo(comment.author),
        createAt: formatDate(comment.createAt, 'datetime'),
        createAtRelative: getRelativeTime(comment.createAt),
        receivers: (comment.receivers || []).map(receiver => formatUserInfo(receiver)),
        files: (comment.files || []).map(file => ({
            name: file.nameOrg || file.name,
            path: file.path,
            url: `${data.cdn.baseUrl}${file.path}`,
            createAt: formatDate(file.createAt, 'datetime'),
            createAtRelative: getRelativeTime(file.createAt)
        })),
        images: (comment.images || []).map(image => ({
            name: image.nameOrg || image.name,
            path: image.path,
            url: `${data.cdn.baseUrl}${image.path}`,
            thumbnail: `${data.cdn.baseUrl}${image.path}`
        }))
    }));
    
    // Generate action URLs
    const actionUrls = {
        web: generateActionUrl('pcm', formattedTask.id),
        mobile: generateActionUrl('mobile-task', formattedTask.id)
    };
    
    return {
        ...data,
        task: formattedTask,
        taskLabels,
        sender: formatUserInfo(sender),
        notice: notice || '',
        comments: formattedComments,
        actionUrls,
        hasComments: formattedComments.length > 0,
        commentCount: formattedComments.length
    };
}

/**
 * Build PCM Project Update template data
 * @param {Object} data - Base template data
 * @returns {Object} Formatted project update data
 */
function buildPCMProjectUpdateData(data) {
    // Implementation for project updates
    return {
        ...data,
        // Add project-specific formatting here
    };
}

/**
 * Build General Notification template data
 * @param {Object} data - Base template data
 * @returns {Object} Formatted general notification data
 */
function buildGeneralNotificationData(data) {
    return {
        ...data,
        actionUrl: data.actionUrl || '#',
        actionText: data.actionText || 'View Details'
    };
}

/**
 * Get task type labels based on subtype and level
 * @param {number} subtype - Task subtype
 * @param {number} level - Task level
 * @returns {Object} Task type labels
 */
function getTaskTypeLabels(subtype, level) {
    const subtypeNum = Number(subtype);
    const levelNum = Number(level);
    
    if ([0, 1, 6, 7, 8, 10, 11].includes(subtypeNum)) {
        return {
            author: 'Author/Người tạo việc',
            assignee: 'Assignee/Người thực hiện'
        };
    } else {
        if (subtypeNum === 4 && levelNum === 2) {
            return {
                author: 'Đơn vị mời thầu',
                assignee: 'Đơn vị dự thầu'
            };
        } else {
            return {
                author: 'Submitter/Người đệ trình',
                assignee: 'Approver/Người phê duyệt'
            };
        }
    }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to calculate relative time from
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date, 'short');
}

/**
 * Create SendGrid email payload
 * @param {string} templateName - Template name from registry
 * @param {string|Array} to - Recipient email(s)
 * @param {Object} templateData - Template data
 * @param {Object} options - Additional email options
 * @returns {Object} SendGrid email payload
 */
function createEmailPayload(templateName, to, templateData, options = {}) {
    const templateId = getTemplateId(templateName);
    
    if (!templateId) {
        throw new Error(`Template ID not found for template: ${templateName}`);
    }
    
    // Ensure 'to' is an array
    const recipients = Array.isArray(to) ? to : [to];
    
    const payload = {
        to: recipients.map(email => ({ email })),
        template_id: templateId,
        dynamic_template_data: templateData
    };
    
    // Add optional fields
    if (options.from) {
        payload.from = options.from;
    }
    
    if (options.reply_to) {
        payload.reply_to = options.reply_to;
    }
    
    if (options.subject) {
        payload.subject = options.subject;
    }
    
    if (options.categories) {
        payload.categories = Array.isArray(options.categories) ? options.categories : [options.categories];
    }
    
    if (options.custom_args) {
        payload.custom_args = options.custom_args;
    }
    
    return payload;
}

/**
 * Validate and build complete email data
 * @param {string} templateName - Template name
 * @param {string|Array} to - Recipients
 * @param {Object} rawData - Raw template data
 * @param {Object} options - Email options
 * @returns {Object} Complete email payload for SendGrid
 */
function buildCompleteEmailData(templateName, to, rawData, options = {}) {
    // Build template data
    const templateData = buildTemplateData(templateName, rawData, options);
    
    // Create email payload
    const emailPayload = createEmailPayload(templateName, to, templateData, options);
    
    return {
        payload: emailPayload,
        templateData,
        templateName,
        recipients: Array.isArray(to) ? to : [to]
    };
}

module.exports = {
    buildTemplateData,
    buildPCMTaskNotificationData,
    buildPCMProjectUpdateData,
    buildGeneralNotificationData,
    createEmailPayload,
    buildCompleteEmailData,
    getTaskTypeLabels,
    getRelativeTime
};