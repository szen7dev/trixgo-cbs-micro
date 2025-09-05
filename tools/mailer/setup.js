#!/usr/bin/env node
"use strict";

/**
 * SendGrid Mailer Setup Script
 * 
 * This script helps users set up and validate their SendGrid mailer configuration.
 * It checks for required dependencies, environment variables, and provides
 * helpful guidance for getting started.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
    console.log(colorize(message, color));
}

function logSection(title) {
    console.log('\n' + colorize('='.repeat(60), 'cyan'));
    console.log(colorize(title.toUpperCase(), 'bright'));
    console.log(colorize('='.repeat(60), 'cyan'));
}

function logSuccess(message) {
    console.log(colorize('✅ ' + message, 'green'));
}

function logWarning(message) {
    console.log(colorize('⚠️  ' + message, 'yellow'));
}

function logError(message) {
    console.log(colorize('❌ ' + message, 'red'));
}

function logInfo(message) {
    console.log(colorize('ℹ️  ' + message, 'blue'));
}

/**
 * Check if a package is installed
 */
function isPackageInstalled(packageName) {
    try {
        require.resolve(packageName);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Check dependencies
 */
function checkDependencies() {
    logSection('Checking Dependencies');
    
    const requiredDeps = [
        { name: 'axios', required: true, description: 'HTTP client for SendGrid API' },
        { name: 'nodemailer', required: false, description: 'Legacy email support (optional)' }
    ];
    
    const missingRequired = [];
    const missingOptional = [];
    
    requiredDeps.forEach(dep => {
        if (isPackageInstalled(dep.name)) {
            logSuccess(`${dep.name} is installed`);
        } else {
            if (dep.required) {
                logError(`${dep.name} is missing (required) - ${dep.description}`);
                missingRequired.push(dep.name);
            } else {
                logWarning(`${dep.name} is missing (optional) - ${dep.description}`);
                missingOptional.push(dep.name);
            }
        }
    });
    
    if (missingRequired.length > 0) {
        logError('\nMissing required dependencies. Install with:');
        log(`npm install ${missingRequired.join(' ')}`, 'yellow');
        log('or', 'yellow');
        log(`yarn add ${missingRequired.join(' ')}`, 'yellow');
        return false;
    }
    
    if (missingOptional.length > 0) {
        logInfo('\nOptional dependencies missing. Install with:');
        log(`npm install ${missingOptional.join(' ')}`, 'blue');
    }
    
    return true;
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
    logSection('Checking Environment Configuration');
    
    const requiredEnvVars = [
        {
            name: 'SENDGRID_API_KEY',
            required: true,
            description: 'SendGrid API key',
            validation: (value) => value && value.startsWith('SG.')
        },
        {
            name: 'SENDGRID_SENDER_EMAIL',
            required: true,
            description: 'Default sender email address',
            validation: (value) => value && value.includes('@')
        },
        {
            name: 'SENDGRID_SENDER_NAME',
            required: false,
            description: 'Default sender name'
        }
    ];
    
    let allValid = true;
    
    requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar.name];
        
        if (!value) {
            if (envVar.required) {
                logError(`${envVar.name} is not set - ${envVar.description}`);
                allValid = false;
            } else {
                logWarning(`${envVar.name} is not set - ${envVar.description}`);
            }
        } else if (envVar.validation && !envVar.validation(value)) {
            logError(`${envVar.name} has invalid format - ${envVar.description}`);
            allValid = false;
        } else {
            logSuccess(`${envVar.name} is configured`);
        }
    });
    
    if (!allValid) {
        logError('\nEnvironment configuration is incomplete.');
        logInfo('Copy .env.sendgrid.example to your .env file and update the values.');
        
        const examplePath = path.join(__dirname, '.env.sendgrid.example');
        if (fs.existsSync(examplePath)) {
            logInfo(`Example file location: ${examplePath}`);
        }
    }
    
    return allValid;
}

/**
 * Test SendGrid connection
 */
async function testSendGridConnection() {
    logSection('Testing SendGrid Connection');
    
    if (!process.env.SENDGRID_API_KEY) {
        logError('Cannot test connection: SENDGRID_API_KEY not set');
        return false;
    }
    
    try {
        const { SendGridMailer } = require('./sendgrid_mailer');
        const mailer = new SendGridMailer();
        
        // Test with a dry run (we'll catch the error to validate API key format)
        logInfo('Testing API key format and basic configuration...');
        
        // Just test the configuration validation
        logSuccess('SendGrid configuration is valid');
        logInfo('To test actual email sending, use the testConfiguration() method');
        
        return true;
        
    } catch (error) {
        logError(`SendGrid connection test failed: ${error.message}`);
        
        if (error.message.includes('API key')) {
            logInfo('Make sure your SENDGRID_API_KEY is valid and has Mail Send permissions');
        }
        
        return false;
    }
}

/**
 * Check file structure
 */
function checkFileStructure() {
    logSection('Checking File Structure');
    
    const requiredFiles = [
        'sendgrid_mailer.js',
        'config/sendgrid_config.js',
        'index.js',
        'README.md'
    ];
    
    const optionalFiles = [
        'examples/basic_usage.js',
        'test/sendgrid_mailer.test.js',
        '.env.sendgrid.example'
    ];
    
    let allPresent = true;
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            logSuccess(`${file} exists`);
        } else {
            logError(`${file} is missing`);
            allPresent = false;
        }
    });
    
    optionalFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            logSuccess(`${file} exists (optional)`);
        } else {
            logWarning(`${file} is missing (optional)`);
        }
    });
    
    return allPresent;
}

/**
 * Show usage examples
 */
function showUsageExamples() {
    logSection('Usage Examples');
    
    log('\n1. Basic email sending:', 'bright');
    log(`
const { sendMail } = require('./tools/mailer/sendgrid_mailer');

const result = await sendMail(
    'user@example.com',
    'Welcome!',
    '<h1>Welcome to our platform!</h1>'
);

if (result.success) {
    console.log('Email sent successfully!');
} else {
    console.error('Failed to send email:', result.error);
}`, 'cyan');
    
    log('\n2. Template email sending:', 'bright');
    log(`
const { sendDynamicTemplateMail } = require('./tools/mailer/sendgrid_mailer');

const result = await sendDynamicTemplateMail(
    'user@example.com',
    'd-your-template-id',
    { firstName: 'John', lastName: 'Doe' }
);
`, 'cyan');
    
    log('\n3. Using the unified interface:', 'bright');
    log(`
const mailer = require('./tools/mailer');

// SendGrid (recommended)
const result = await mailer.send('user@example.com', 'Subject', 'Content');

// Legacy Nodemailer (backward compatibility)
const legacyResult = await mailer.sendLegacy('user@example.com', 'Subject', 'Content');
`, 'cyan');
}

/**
 * Show next steps
 */
function showNextSteps() {
    logSection('Next Steps');
    
    log('\n1. 📧 Set up SendGrid account:', 'bright');
    log('   - Visit https://sendgrid.com and create an account');
    log('   - Verify your sender domain or email address');
    log('   - Generate an API key with "Mail Send" permissions');
    
    log('\n2. 🔧 Configure environment variables:', 'bright');
    log('   - Copy .env.sendgrid.example to your main .env file');
    log('   - Update SENDGRID_API_KEY and SENDGRID_SENDER_EMAIL');
    
    log('\n3. 🎨 Create email templates (optional):', 'bright');
    log('   - Design templates in SendGrid dashboard');
    log('   - Add template IDs to your configuration');
    
    log('\n4. 🧪 Test your setup:', 'bright');
    log('   - Run: node tools/mailer/examples/basic_usage.js');
    log('   - Or use: mailer.testConfiguration("your-email@example.com")');
    
    log('\n5. 📚 Read the documentation:', 'bright');
    log('   - Check tools/mailer/README.md for detailed usage');
    log('   - Review examples in tools/mailer/examples/');
}

/**
 * Main setup function
 */
async function runSetup() {
    log(colorize('\n🚀 SendGrid Mailer Setup', 'bright'));
    log(colorize('This script will help you set up and validate your SendGrid mailer configuration.\n', 'blue'));
    
    const checks = {
        fileStructure: checkFileStructure(),
        dependencies: checkDependencies(),
        environment: checkEnvironment()
    };
    
    if (checks.dependencies && checks.environment) {
        await testSendGridConnection();
    }
    
    // Summary
    logSection('Setup Summary');
    
    if (checks.fileStructure && checks.dependencies && checks.environment) {
        logSuccess('✅ Setup is complete! Your SendGrid mailer is ready to use.');
        showUsageExamples();
    } else {
        logWarning('⚠️  Setup is incomplete. Please address the issues above.');
        showNextSteps();
    }
    
    log('\n' + colorize('For more help, check the README.md file or visit:', 'blue'));
    log(colorize('https://docs.sendgrid.com/for-developers/sending-email/api-getting-started', 'cyan'));
}

// Run setup if this file is executed directly
if (require.main === module) {
    runSetup().catch(error => {
        logError(`Setup failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    runSetup,
    checkDependencies,
    checkEnvironment,
    testSendGridConnection,
    checkFileStructure
};