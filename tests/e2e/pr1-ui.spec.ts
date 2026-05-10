import { expect, test } from "@playwright/test";

test.describe("破産防衛都市 PR1 UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("ランディング、登録、マップ生成、ゲーム開始が動く", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "破産防衛都市" })).toBeVisible();
    await page.getByRole("button", { name: "新規登録" }).click();
    await page.getByRole("button", { name: "登録して本社を守る" }).click();
    await expect(page.getByRole("heading", { name: /経営会議/ })).toBeVisible();

    await page.getByRole("button", { name: "マップ生成" }).click();
    await expect(page.getByRole("heading", { name: "マップ生成" })).toBeVisible();
    await page.getByRole("button", { name: "この土地で防衛する" }).click();
    await expect(page.getByTestId("phaser-game")).toBeVisible();
  });

  test("建物配置、夜フェーズ、セーブが動く", async ({ page }) => {
    await page.getByRole("button", { name: "ゲストプレイ" }).click();
    await expect(page.getByTestId("phaser-game")).toBeVisible();
    await page.getByTestId("select-Road").click();
    await page.mouse.click(240, 220);
    await page.getByRole("button", { name: "夜を開始" }).click();
    await expect(page.getByText("夜フェーズ")).toBeVisible();
    await page.evaluate(() => (window as Window & { advanceTime?: (ms: number) => void }).advanceTime?.(1000));
    const text = await page.evaluate(() => (window as Window & { render_game_to_text?: () => string }).render_game_to_text?.());
    expect(text).toContain("enemies");
    await page.getByRole("button", { name: "セーブ" }).click();
  });

  test("ガチャとカード一覧を確認できる", async ({ page }) => {
    await page.getByRole("button", { name: "ゲストプレイ" }).click();
    await page.getByRole("button", { name: "ガチャ" }).click();
    await page.getByRole("button", { name: "1回引く" }).click();
    await expect(page.getByText("緊急つなぎ融資")).toBeVisible();
    await page.getByRole("button", { name: "カード" }).click();
    await expect(page.getByRole("heading", { name: "カード / デッキ" })).toBeVisible();
    await expect(page.getByTestId("inventory-cards").getByText("節税の達人")).toBeVisible();
  });

  test("360x640でも主要UIが操作できる", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.getByRole("button", { name: "ゲストプレイ" }).click();
    await expect(page.getByTestId("phaser-game")).toBeVisible();
    await expect(page.getByText("建設パネル")).toBeVisible();
    await page.getByRole("button", { name: "設定" }).click();
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();
  });
});
