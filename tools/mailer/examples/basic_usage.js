"use strict";

/**
 * Basic Usage Examples for SendGrid Mailer
 * 
 * This file demonstrates various ways to use the SendGrid mailer module
 * for common email sending scenarios.
 */

const { sendMail, sendDynamicTemplateMail, sendBulkTemplateMail } = require('../sendgrid_mailer');

/**
 * Example 1: Send a simple HTML welcome email
 */
async function sendWelcomeEmail() {
    console.log('\n=== Sending Welcome Email ===');
    
    try {
        const result = await sendMail(
            'newuser@example.com',
            'Welcome to Trixgo Platform!',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333; text-align: center;">Welcome to Trixgo!</h1>
                <p>Dear New User,</p>
                <p>Thank you for joining our platform. We're excited to have you on board!</p>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3>Getting Started:</h3>
                    <ul>
                        <li>Complete your profile setup</li>
                        <li>Explore our features</li>
                        <li>Join our community</li>
                    </ul>
                </div>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Best regards,<br>The Trixgo Team</p>
            </div>
            `,
            { isHtml: true }
        );
        
        if (result.success) {
            console.log('✅ Welcome email sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.error('❌ Failed to send welcome email:', result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error in sendWelcomeEmail:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Example 2: Send a plain text notification
 */
async function sendPlainTextNotification() {
    console.log('\n=== Sending Plain Text Notification ===');
    
    try {
        const result = await sendMail(
            'admin@example.com',
            'System Alert: High CPU Usage',
            `
SYSTEM ALERT
============

Server: web-server-01
Alert: High CPU Usage
Current Usage: 85%
Threshold: 80%
Time: ${new Date().toISOString()}

Please investigate immediately.

--
Trixgo Monitoring System
            `.trim(),
            { 
                isHtml: false,
                from: 'monitoring@trixgo.com',
                fromName: 'Trixgo Monitoring'
            }
        );
        
        if (result.success) {
            console.log('✅ System alert sent successfully!');
        } else {
            console.error('❌ Failed to send system alert:', result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error in sendPlainTextNotification:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Example 3: Send email to multiple recipients
 */
async function sendNewsletterToMultiple() {
    console.log('\n=== Sending Newsletter to Multiple Recipients ===');
    
    const recipients = [
        'subscriber1@example.com',
        'subscriber2@example.com',
        'subscriber3@example.com'
    ];
    
    try {
        const result = await sendMail(
            recipients,
            'Monthly Newsletter - March 2024',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <header style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
                    <h1>Trixgo Monthly Newsletter</h1>
                    <p>March 2024 Edition</p>
                </header>
                
                <main style="padding: 20px;">
                    <h2>What's New This Month</h2>
                    <ul>
                        <li>🚀 New dashboard features</li>
                        <li>📊 Enhanced analytics</li>
                        <li>🔒 Improved security measures</li>
                        <li>🎨 UI/UX improvements</li>
                    </ul>
                    
                    <h2>Upcoming Events</h2>
                    <p>Join us for our monthly webinar on April 15th at 2 PM EST.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <strong>Pro Tip:</strong> Did you know you can customize your dashboard layout? 
                        Check out the settings panel!
                    </div>
                </main>
                
                <footer style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                    <p>© 2024 Trixgo Platform. All rights reserved.</p>
                    <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
                </footer>
            </div>
            `
        );
        
        if (result.success) {
            console.log(`✅ Newsletter sent to ${recipients.length} recipients!`);
        } else {
            console.error('❌ Failed to send newsletter:', result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error in sendNewsletterToMultiple:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Example 4: Send password reset email using dynamic template
 * Note: You need to create this template in your SendGrid account first
 */
async function sendPasswordResetEmail() {
    console.log('\n=== Sending Password Reset Email (Template) ===');
    
    try {
        // Replace with your actual template ID
        const templateId = 'd-1234567890abcdef1234567890abcdef';
        
        const result = await sendDynamicTemplateMail(
            'user@example.com',
            templateId,
            {
                firstName: 'John',
                lastName: 'Doe',
                resetLink: 'https://app.trixgo.com/reset-password?token=abc123xyz789',
                expirationTime: '24 hours',
                supportEmail: 'support@trixgo.com'
            }
        );
        
        if (result.success) {
            console.log('✅ Password reset email sent successfully!');
        } else {
            console.error('❌ Failed to send password reset email:', result.error);
            if (result.error.includes('template')) {
                console.log('💡 Make sure to create the template in SendGrid and update the templateId');
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('Error in sendPasswordResetEmail:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Example 5: Send bulk personalized emails
 */
async function sendBulkPersonalizedEmails() {
    console.log('\n=== Sending Bulk Personalized Emails ===');
    
    const users = [
        {
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Johnson',
            plan: 'Premium',
            renewalDate: '2024-04-15'
        },
        {
            email: 'bob@example.com',
            firstName: 'Bob',
            lastName: 'Smith',
            plan: 'Basic',
            renewalDate: '2024-04-20'
        },
        {
            email: 'carol@example.com',
            firstName: 'Carol',
            lastName: 'Davis',
            plan: 'Enterprise',
            renewalDate: '2024-04-25'
        }
    ];
    
    try {
        // Replace with your actual template ID
        const templateId = 'd-subscription-renewal-template';
        
        const recipients = users.map(user => ({
            email: user.email,
            templateData: {
                firstName: user.firstName,
                lastName: user.lastName,
                plan: user.plan,
                renewalDate: user.renewalDate,
                accountUrl: `https://app.trixgo.com/account/${user.email}`,
                supportUrl: 'https://support.trixgo.com'
            }
        }));
        
        const result = await sendBulkTemplateMail(
            recipients,
            templateId,
            {
                from: 'billing@trixgo.com',
                fromName: 'Trixgo Billing'
            }
        );
        
        if (result.success) {
            console.log(`✅ Bulk emails sent to ${recipients.length} users!`);
        } else {
            console.error('❌ Failed to send bulk emails:', result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error in sendBulkPersonalizedEmails:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Example 6: Error handling demonstration
 */
async function demonstrateErrorHandling() {
    console.log('\n=== Error Handling Demonstration ===');
    
    // Test with invalid email
    console.log('Testing with invalid email...');
    const invalidEmailResult = await sendMail(
        'invalid-email',
        'Test Subject',
        'Test content'
    );
    
    if (!invalidEmailResult.success) {
        console.log('✅ Correctly caught invalid email:', invalidEmailResult.error);
    }
    
    // Test with empty subject
    console.log('Testing with empty subject...');
    const emptySubjectResult = await sendMail(
        'valid@example.com',
        '',
        'Test content'
    );
    
    if (!emptySubjectResult.success) {
        console.log('✅ Correctly caught empty subject:', emptySubjectResult.error);
    }
    
    // Test with missing template ID
    console.log('Testing with invalid template ID...');
    const invalidTemplateResult = await sendDynamicTemplateMail(
        'valid@example.com',
        '',
        { name: 'Test' }
    );
    
    if (!invalidTemplateResult.success) {
        console.log('✅ Correctly caught invalid template ID:', invalidTemplateResult.error);
    }
}

/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('🚀 Starting SendGrid Mailer Examples...');
    console.log('Note: Make sure to set your SENDGRID_API_KEY environment variable');
    
    try {
        // Run basic examples
        await sendWelcomeEmail();
        await sendPlainTextNotification();
        await sendNewsletterToMultiple();
        
        // Template examples (will show errors if templates don't exist)
        await sendPasswordResetEmail();
        await sendBulkPersonalizedEmails();
        
        // Error handling demonstration
        await demonstrateErrorHandling();
        
        console.log('\n✅ All examples completed!');
        console.log('\n💡 Tips:');
        console.log('- Create templates in SendGrid for template examples');
        console.log('- Update template IDs in the code');
        console.log('- Check your SendGrid dashboard for delivery statistics');
        
    } catch (error) {
        console.error('❌ Error running examples:', error.message);
    }
}

// Export functions for individual testing
module.exports = {
    sendWelcomeEmail,
    sendPlainTextNotification,
    sendNewsletterToMultiple,
    sendPasswordResetEmail,
    sendBulkPersonalizedEmails,
    demonstrateErrorHandling,
    runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}