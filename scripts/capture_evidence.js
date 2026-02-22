const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

/**
 * E2E Reporter Script
 * Usage: node capture_evidence.js <url> <actions_json> <output_dir>
 */

async function run() {
    const [,, url, actionsJson, outputDir] = process.argv;
    
    if (!url || !actionsJson || !outputDir) {
        console.error("Usage: node capture_evidence.js <url> <actions_json> <output_dir>");
        process.exit(1);
    }

    const actions = JSON.parse(actionsJson);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const results = {
        startTime: new Date().toISOString(),
        url,
        steps: [],
        errors: []
    };

    console.log(`🚀 Starting E2E Session for: ${url}`);

    const browser = await puppeteer.launch({
        executablePath: '/workspace/chrome-linux64/chrome',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    // Capture API Responses
    const apiResponses = [];
    page.on('response', async response => {
        const resUrl = response.url();
        if (resUrl.includes('/api/')) {
            try {
                const status = response.status();
                const body = await response.json().catch(() => null);
                apiResponses.push({ url: resUrl, status, body });
            } catch (e) {}
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const stepId = (i + 1).toString().padStart(2, '0');
            console.log(`Step ${stepId}: ${action.description}`);

            try {
                if (action.type === 'click') {
                    await page.click(action.selector);
                } else if (action.type === 'type') {
                    await page.focus(action.selector);
                    await page.keyboard.type(action.text);
                } else if (action.type === 'wait') {
                    await new Promise(r => setTimeout(r, action.ms || 1000));
                }

                const screenshotPath = path.join(outputDir, `step_${stepId}.png`);
                await page.screenshot({ path: screenshotPath });
                
                results.steps.push({
                    id: stepId,
                    description: action.description,
                    screenshot: screenshotPath,
                    timestamp: new Date().toISOString()
                });
            } catch (stepError) {
                console.error(`Error in step ${stepId}:`, stepError.message);
                results.errors.push({ step: stepId, message: stepError.message });
            }
        }

        results.apiResponses = apiResponses;
        results.endTime = new Date().toISOString();
        
        fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
        console.log(`✅ E2E Finished. Evidence in ${outputDir}`);

    } catch (e) {
        console.error("Fatal Error:", e);
    } finally {
        await browser.close();
    }
}

run();
