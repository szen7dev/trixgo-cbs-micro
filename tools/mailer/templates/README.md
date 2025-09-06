# SendGrid Dynamic Email Templates

This directory contains dynamic email templates for SendGrid integration.

## Directory Structure

```
templates/
├── README.md                 # This file
├── config/                   # Template configuration files
│   ├── template_registry.js  # Template ID registry and mapping
│   └── template_config.js    # Template configuration utilities
├── pcm/                      # PCM (Project/Task Management) templates
│   ├── task_notification.js  # Task notification template
│   └── task_notification.html # HTML template for SendGrid
├── shared/                   # Shared template components
│   ├── header.html           # Common email header
│   ├── footer.html           # Common email footer
│   └── styles.css            # Common styles
└── utils/                    # Template utilities
    ├── template_builder.js   # Template building utilities
    └── data_formatter.js     # Data formatting for templates
```

## Template Types

### PCM Templates
- **task_notification**: For task-related notifications (creation, updates, comments)

### Shared Components
- **header**: Common branding and header elements
- **footer**: Common footer with unsubscribe and company info
- **styles**: Consistent styling across all templates

## Usage

1. Templates are registered in `config/template_registry.js`
2. Use `template_builder.js` to construct template data
3. Send emails using the SendGrid mailer with template IDs

## Template Data Structure

Each template expects specific data structure. See individual template files for details.