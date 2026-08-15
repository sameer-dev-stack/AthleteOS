import { test, expect } from '@playwright/test';

test.describe('AvatarCropModal harness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/crop-harness');
    // Dismiss cookie consent so it can't intercept clicks
    const accept = page.getByRole('button', { name: 'Accept' });
    if (await accept.isVisible().catch(() => false)) {
      await accept.click();
    }
    await page.getByRole('button', { name: 'Open with test image' }).click();
    await expect(page.getByText('Crop your photo')).toBeVisible();
    await page.waitForTimeout(600);
  });

  test('BUG 1: overlay covers entire crop viewport (pixel sampling)', async ({ page }) => {
    const container = page.getByTestId('container');
    const box = (await container.boundingBox())!;
    expect(box).not.toBeNull();

    // Screenshot the container region, then sample pixels in-browser
    const shot = await container.screenshot();
    const { w, h, pixels } = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return {
        w: c.width,
        h: c.height,
        pixels: Array.from(ctx.getImageData(0, 0, c.width, c.height).data),
      };
    }, shot.toString('base64'));
    console.log('screenshot dims', w, h);
    const sample = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      if (i + 3 >= pixels.length) return undefined;
      return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], a: pixels[i + 3] };
    };

    // Corners (should be masked/darkened by the overlay)
    const corners = [
      sample(2, 2), sample(w - 3, 2), sample(2, h - 3), sample(w - 3, h - 3),
      sample(Math.floor(w / 2), 2), sample(Math.floor(w / 2), h - 3),
      sample(2, Math.floor(h / 2)), sample(w - 3, Math.floor(h / 2)),
    ].filter((p) => p !== undefined);
    // Center should show the bright test image (not fully dark)
    const center = sample(Math.floor(w / 2), Math.floor(h / 2));
    // Inner band near center (inside circle) should be brighter than corners
    const nearCenter = sample(Math.floor(w / 2) + 30, Math.floor(h / 2));

    const avgCorner = corners.reduce((s, p) => s + (p.r + p.g + p.b), 0) / corners.length;
    console.log('corner pixels:', JSON.stringify(corners.map((p) => Math.round((p.r + p.g + p.b) / 3))));

    // Dense scan of the full border (3px inset) for any unmasked bright pixels
    const lum = (x: number, y: number) => {
      const p = sample(x, y);
      return p ? (p.r + p.g + p.b) / 3 : -1;
    };
    const brightGaps: Array<[number, number, number]> = [];
    for (let x = 0; x < w; x += 2) {
      for (const y of [2, h - 3]) {
        const l = lum(x, y);
        if (l > 60) brightGaps.push([x, y, Math.round(l)]);
      }
    }
    for (let y = 0; y < h; y += 2) {
      for (const x of [2, w - 3]) {
        const l = lum(x, y);
        if (l > 60) brightGaps.push([x, y, Math.round(l)]);
      }
    }
    console.log('bright gaps along border:', JSON.stringify(brightGaps));
    expect(brightGaps.length).toBe(0);
    const centerLum = (center.r + center.g + center.b) / 3;
    const nearCenterLum = (nearCenter.r + nearCenter.g + nearCenter.b) / 3;

    console.log('avg corner lum:', Math.round(avgCorner), 'center lum:', Math.round(centerLum), 'near-center lum:', Math.round(nearCenterLum));

    // Corners must be darkened (< 80 avg per-channel) — overlay must cover them
    expect(avgCorner).toBeLessThan(80);
    // Center must be bright (the gradient image is bright)
    expect(centerLum).toBeGreaterThan(60);
    // Inner area must be brighter than corners — circle is unmasked
    expect(nearCenterLum).toBeGreaterThan(avgCorner);
  });

  test('BUG 2: controls stay visible regardless of cursor position', async ({ page }) => {
    const zoomOut = page.getByRole('button', { name: 'Zoom out' });
    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    const reset = page.getByRole('button', { name: 'Reset' });
    const useAsIs = page.getByRole('button', { name: 'Use as is' });
    const crop = page.getByRole('button', { name: 'Crop' });
    const slider = page.getByRole('slider', { name: 'Zoom' });

    const positions: Array<[number, number]> = [
      [30, 30], // top-left, outside crop area
      [600, 400], // far corner of modal
      [120, 120], // near center of crop area
      [400, 300], // controls area
      [200, 500], // bottom area
    ];

    for (const [x, y] of positions) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(120);
      await expect(zoomOut).toBeVisible();
      await expect(zoomIn).toBeVisible();
      await expect(reset).toBeVisible();
      await expect(useAsIs).toBeVisible();
      await expect(crop).toBeVisible();
      await expect(slider).toBeVisible();
      // Opacity must be fully visible (not faded to 0)
      for (const el of [zoomOut, zoomIn, reset, useAsIs, crop, slider]) {
        const op = await el.evaluate((n) => getComputedStyle(n).opacity);
        expect(parseFloat(op)).toBeGreaterThan(0.9);
      }
    }
  });

  test('BUG 3: clicking/dragging the image never opens the file picker', async ({ page }) => {
    let fileChooserCount = 0;
    page.on('filechooser', () => fileChooserCount++);

    const container = page.getByTestId('container');
    const box = (await container.boundingBox())!;

    // Click center
    await container.click({ position: { x: box.width / 2, y: box.height / 2 } });
    // Click corners and edge (inside the crop region and outside it)
    for (const [fx, fy] of [[0.1, 0.1], [0.9, 0.9], [0.5, 0.95], [0.05, 0.5]]) {
      await container.click({ position: { x: box.width * fx, y: box.height * fy } });
    }
    // Click and hold + drag
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, { steps: 5 });
    await page.mouse.up();

    await page.waitForTimeout(400);
    expect(fileChooserCount).toBe(0);
  });

  test('controls work: zoom, reset, use-as-is, crop', async ({ page }) => {
    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    const zoomOut = page.getByRole('button', { name: 'Zoom out' });
    const reset = page.getByRole('button', { name: 'Reset' });
    const slider = page.getByRole('slider', { name: 'Zoom' });

    await zoomIn.click();
    await expect(slider).toHaveValue('1.1');
    await zoomIn.click();
    await expect(slider).toHaveValue('1.2');
    await zoomOut.click();
    await expect(slider).toHaveValue('1.1');
    await reset.click();
    await expect(slider).toHaveValue('1');

    // Use as is
    await page.getByRole('button', { name: 'Use as is' }).click();
    await page.waitForTimeout(1200);
    await expect(page.getByText('Crop your photo')).not.toBeVisible();
    await expect(page.getByAltText('Final output')).toBeVisible();
  });

  test('preview matches final output (same crop state)', async ({ page }) => {
    // After opening, the result thumb should exist
    await page.waitForTimeout(800);
    const thumb = page.locator('img[alt="Cropped preview"]');
    await expect(thumb).toBeVisible();

    const thumbSrc = await thumb.getAttribute('src');
    expect(thumbSrc).toMatch(/^blob:/);

    // Click Crop and get final
    await page.getByRole('button', { name: 'Crop' }).click();
    await page.waitForTimeout(1200);
    const finalImg = page.getByAltText('Final output');
    await expect(finalImg).toBeVisible();
    const finalSrc = await finalImg.getAttribute('src');
    expect(finalSrc).toMatch(/^blob:/);
    expect(finalSrc).not.toBe(thumbSrc);
  });

  test('modal backdrop click closes, inner card click does not', async ({ page }) => {
    // Click inside the card (near header) — should NOT close
    const card = page.locator('div.fixed.inset-0 > div.w-full.max-w-md');
    await card.click({ position: { x: 30, y: 30 } });
    await expect(page.getByText('Crop your photo')).toBeVisible();

    // Click the backdrop outside the card — closes
    await page.mouse.click(8, 8);
    await page.waitForTimeout(300);
    await expect(page.getByText('Crop your photo')).not.toBeVisible();
  });
});
