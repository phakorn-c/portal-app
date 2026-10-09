import { expect, test } from '@playwright/test';

import { resetDatabase } from './support/test-environment';

test('search keeps focus and accepts more typing after results update', async ({
    page,
}) => {
    // Given the procurement search page
    resetDatabase();
    await page.goto('/procurement');
    const query = page.getByRole('textbox', { name: 'คำค้นประกาศ' });

    // When the first character updates the results
    await query.focus();
    await Promise.all([
        page.waitForURL((url) => url.searchParams.get('query') === 'Q'),
        query.press('Q'),
    ]);

    // Then typing continues without clicking the field again
    await expect(query).toBeFocused();
    await Promise.all([
        page.waitForURL((url) => url.searchParams.get('query') === 'QA'),
        query.press('A'),
    ]);
    await expect(query).toHaveValue('QA');
});

test('budget slider continues dragging after results update', async ({
    page,
}) => {
    // Given the procurement search page
    resetDatabase();
    await page.goto('/procurement');
    const minimum = page.getByRole('slider', { name: 'ราคาต่ำสุด' });
    const bounds = await minimum.boundingBox();
    if (!bounds) throw new Error('Minimum budget slider is not visible');
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;

    // When a drag triggers a results update
    await page.mouse.move(x, y);
    await page.mouse.down();
    await Promise.all([
        page.waitForURL(
            (url) => Number(url.searchParams.get('budget_min')) > 0,
        ),
        page.mouse.move(x + 40, y),
    ]);
    const firstValue = Number(
        new URL(page.url()).searchParams.get('budget_min'),
    );

    // Then the same drag can move the thumb farther
    await page.mouse.move(x + 80, y);
    await expect(page).toHaveURL(
        (url) => Number(url.searchParams.get('budget_min')) > firstValue,
    );
    await page.mouse.up();
});
