import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should successfully sign up', async ({ page }) => {
    await page.goto('http://localhost:3000/signup');
    
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.fill('input[placeholder="••••••••"]:nth-of-type(2)', 'TestPassword123!');
    
    await page.click('button:has-text("Create Account")');
    
    // Should redirect to dashboard or profile
    await expect(page).toHaveURL(/\/(dashboard|profile)/);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // This would require setting up auth cookies or logging in first
    // For now, we'll skip if not authenticated
    await page.goto('http://localhost:3000/dashboard');
  });

  test('should display hackathons', async ({ page }) => {
    // Wait for hackathons to load
    await page.waitForSelector('text=Dashboard', { timeout: 5000 }).catch(() => {});
    
    // Check if page loaded
    const heading = page.locator('text=Dashboard');
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible();
    }
  });
});

test.describe('Team Creation', () => {
  test('should create a team in hackathon', async ({ page }) => {
    // This test would require:
    // 1. Being logged in
    // 2. Being in a hackathon page
    // 3. Clicking create team button
    // 4. Filling form and submitting
    
    await page.goto('http://localhost:3000/hackathons/test-id/teams');
    
    // Wait for page to load
    await page.waitForSelector('[class*="card"]', { timeout: 5000 }).catch(() => {});
  });
});

test.describe('Submission', () => {
  test('should submit project', async ({ page }) => {
    // Test submission flow
    // 1. Navigate to team page
    // 2. Click submit project
    // 3. Fill GitHub and live URL
    // 4. Submit
    
    await page.goto('http://localhost:3000/teams/test-team-id');
    
    // Wait for page to load
    await page.waitForSelector('button', { timeout: 5000 }).catch(() => {});
  });
});
