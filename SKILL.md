---
name: e2e-reporter
description: "Automated E2E testing and evidence collection using Puppeteer. Use when you need to: (1) Verify application flows with real browser execution, (2) Capture screenshots for progress reports, (3) Inspect API responses in a live environment, (4) Generate verifiable evidence of feature completion."
---

# E2E Reporter Skill

This skill automates the process of running an application, performing user actions, and collecting evidence (screenshots and API logs) for reporting.

## Core Capabilities

1. **Visual Verification**: Take high-resolution mobile/desktop screenshots of any app flow.
2. **API Inspection**: Intercept and log all `/api/` network traffic during the test.
3. **Structured Reporting**: Generate a Markdown report combining visual evidence and technical logs.

## Workflow

### 1. Preparation
Ensure the application is running (e.g., `docker-compose up` or local server).

### 2. Define Actions
Create a JSON array of actions to perform:
```json
[
  { "type": "wait", "ms": 2000, "description": "Initial Load" },
  { "type": "type", "selector": "#search", "text": "Medellin", "description": "Search for destination" },
  { "type": "click", "selector": ".btn-go", "description": "Confirm navigation" }
]
```

### 3. Capture Evidence
Run the internal script using `node`:
```bash
node scripts/capture_evidence.js <url> '<actions_json>' <output_dir>
```

### 4. Generate Report
Use the data from `results.json` to populate the `references/template-report.md`.

## Scripts

- **capture_evidence.js**: The Puppeteer engine. It uses the Chrome binary located at `/workspace/chrome-linux64/chrome`.

## Best Practices

- **Mobile First**: Default viewport is 375x812 (Mobile).
- **Graceful Delays**: Use `wait` actions after clicks or navigations to allow the UI to catch up.
- **Cleanup**: Store evidence in `/tmp/evidence` or a project-specific directory to avoid workspace clutter.
