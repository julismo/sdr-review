import { expect, test } from "@playwright/test";

test("reviews a synthetic request and resets the local demo", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") {
      externalRequests.push(url.href);
    }
  });

  await page.goto("/");

  await expect(page).toHaveTitle("SDR Review");
  await expect(
    page.getByRole("heading", { name: "SDR Review" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Aurora Fieldworks/i }).click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();

  await expect(
    page.getByText("Human reviewer approved the request."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "Reset demo data" }).click();

  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Human reviewer approved the request."),
  ).not.toBeVisible();
  expect(externalRequests).toEqual([]);
});
