/**
 * scripts/capture-screenshots.mjs
 *
 * Logs into a real (deployed or local) instance of TaskFlow and captures
 * the 7 screenshots referenced in the README's Screenshots section.
 *
 * Setup (one-time):
 *   npm install -D playwright
 *   npx playwright install chromium
 *
 * Run:
 *   node scripts/capture-screenshots.mjs
 *
 * Output: screenshots/*.png in the project root, matching exactly what
 * the README's image links expect (dashboard.png, projects.png, kanban.png,
 * calendar.png, analytics.png, profile.png, login.png).
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// ---- Edit these three before running ----
const BASE_URL = 'https://taskflow-sde26.vercel.app';
const DEMO_EMAIL = 'demo@taskflow.com';
const DEMO_PASSWORD = 'Demo@123';
// ------------------------------------------

const OUT_DIR = path.resolve('screenshots');
mkdirSync(OUT_DIR, { recursive: true });

async function shoot(page, filename) {
  await page.waitForTimeout(500); // let transitions/animations settle
  await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: false });
  console.log(`✓ ${filename}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Warm up the Render backend first (free tier cold-starts take up to 60s)
  console.log('Warming up Render backend…');
  try {
    await page.goto('https://taskflow-api-enwg.onrender.com/api/health', { timeout: 90000, waitUntil: 'load' });
  } catch { /* ignore — just want to wake the server up */ }
  console.log('Backend warm, continuing…');

  // 1. Login page — clean, unauthenticated state
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#login-email', { timeout: 60000 });
  await shoot(page, 'login.png');

  // Log in
  await page.fill('#login-email', DEMO_EMAIL);
  await page.fill('#login-password', DEMO_PASSWORD);
  await page.click('#login-submit');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 });

  // 2. Dashboard
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // let task list / activity feed populate
  await shoot(page, 'dashboard.png');

  // 3. Projects
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h3'); // first project card title
  await shoot(page, 'projects.png');

  // 4. Kanban — click into the first project card
  await page.locator('h3').first().click();
  await page.waitForURL(/\/projects\/.+/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await shoot(page, 'kanban.png');

  // 5. Calendar — open today's day panel
  await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const todayCell = page.locator('span.bg-violet-600.text-white').first();
  if (await todayCell.count()) {
    await todayCell.click();
    await page.waitForTimeout(500);
  }
  await shoot(page, 'calendar.png');

  // 6. Analytics — wait for charts to actually render
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.recharts-wrapper', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await shoot(page, 'analytics.png');

  // 7. Profile
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shoot(page, 'profile.png');

  await browser.close();
  console.log('\nAll 7 screenshots saved to /screenshots');
}

main().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
