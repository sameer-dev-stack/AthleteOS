import { test, expect } from '@playwright/test';

const TEST_IMAGE = 'crop-test-image.jpg';

test.describe('AvatarCropModal harness', () => {
  test('reproduces the three reported bugs', async ({ page }) => {
    const pickerOpened = page.locator('#picker-opened');
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);

    await page.goto('/crop-harness');
    await page.getByRole('button', { name: 'Open with test image' }).click();

    // Modal opens
    const modal = page.getByText('Crop your photo');
    await expect(modal).toBeVisible();
    await page.waitForTimeout(800);

    // Capture: overlay coverage screenshot
    await page.screenshot({ path: 'test-results/harness-overlay.png' });

    // 1. Click the image inside the cropper — must NOT open the file picker
    const container = page.getByTestId('container');
    await container.click({ position: { x: 160, y: 160 } });
    const chooser1 = await fileChooserPromise;
    await page.waitForTimeout(400);

    // 2. Hover outside crop area then check controls remain visible
    await page.mouse.move(30, 30);
    await page.waitForTimeout(300);
    const zoomOut = page.getByRole('button', { name: 'Zoom out' });
    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    const reset = page.getByRole('button', { name: 'Reset' });
    const useAsIs = page.getByRole('button', { name: 'Use as is' });
    const crop = page.getByRole('button', { name: 'Crop' });
    const slider = page.getByRole('slider', { name: 'Zoom' });
    await expect(zoomOut).toBeVisible();
    await expect(zoomIn).toBeVisible();
    await expect(reset).toBeVisible();
    await expect(useAsIs).toBeVisible();
    await expect(crop).toBeVisible();
    await expect(slider).toBeVisible();

    // Slider present and draggable
    const sliderBox = await slider.boundingBox();
    expect(sliderBox).not.toBeNull();

    // Zoom in then reset
    await zoomIn.click();
    await expect(slider).toHaveValue('1.1');
    await reset.click();
    await expect(slider).toHaveValue('1');

    // Result preview exists
    await page.waitForTimeout(600);
    await expect(page.getByText('Result', { exact: true })).toBeVisible();

    // Overlay: the crop area should have a big box-shadow (mask) — check computed style
    const cropArea = page.getByTestId('cropper');
    const shadow = await cropArea.evaluate((el) => getComputedStyle(el).boxShadow);
    console.log('Crop area box-shadow:', shadow);

    await page.screenshot({ path: 'test-results/harness-hover-outside.png' });

    // Report whether picker was opened by clicking the image
    expect(chooser1).toBeNull();

    // Now click Crop and confirm modal closes + result appears
    await crop.click();
    await page.waitForTimeout(1200);
    await expect(modal).not.toBeVisible();
    await expect(page.getByAltText('Final output')).toBeVisible();
    await page.screenshot({ path: 'test-results/harness-final.png' });
  });

  test('file input exists but image click does not trigger it', async ({ page }) => {
    await page.goto('/crop-harness');
    await page.getByRole('button', { name: 'Open with test image' }).click();
    await expect(page.getByText('Crop your photo')).toBeVisible();

    let fileChooserCount = 0;
    page.on('filechooser', () => fileChooserCount++);

    const container = page.getByTestId('container');
    // Click center, then drag
    await container.click({ position: { x: 160, y: 160 } });
    await container.dragTo(container, { targetPosition: { x: 200, y: 200 } });
    await page.waitForTimeout(500);

    expect(fileChooserCount).toBe(0);
  });
});
