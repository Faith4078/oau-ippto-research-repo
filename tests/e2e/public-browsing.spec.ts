import { expect, test } from "@playwright/test";

const collectionPages = [
	{
		path: "/research",
		heading: /Find OAU Research/i,
		search: /Search by title, author, keyword, or abstract/i,
	},
	{
		path: "/researchers",
		heading: /Find Experts Across the University/i,
		search: /Search researchers, interests, or departments/i,
	},
	{
		path: "/reports",
		heading: /Reports and Statistics/i,
		search: /Search reports, statistics, years, or faculties/i,
	},
];

for (const pageConfig of collectionPages) {
	test(`${pageConfig.path} supports public discovery browsing`, async ({
		page,
	}) => {
		await page.goto(pageConfig.path);

		await expect(
			page.getByRole("heading", { name: pageConfig.heading }),
		).toBeVisible();
		await expect(page.getByPlaceholder(pageConfig.search)).toBeVisible();
		await expect(page.getByText(/\d+ results? from public data/i)).toBeVisible();
		await expect(page.getByRole("alert")).toHaveCount(0);
	});
}

test("anonymous public data opts into CDN stale-while-revalidate caching", async ({
	request,
}) => {
	const response = await request.get("/api/public-statistics", {
		headers: { Accept: "application/json" },
	});

	expect(response.ok()).toBe(true);
	expect(response.headers()["cache-control"]).toContain("s-maxage=300");
	expect(response.headers()["cache-control"]).toContain(
		"stale-while-revalidate=86400",
	);
});

test("public research search returns real records and opens their detail", async ({
	page,
	request,
}) => {
	const response = await request.post("/api/search", {
		headers: { Accept: "application/json" },
		data: {
			filters: { entityTypes: ["research"] },
			page: 1,
			pageSize: 1,
		},
	});
	expect(response.ok()).toBe(true);
	const payload = (await response.json()) as {
		data: { items: Array<{ title: string; url: string }> };
	};
	const record = payload.data.items[0];
	expect(record).toBeDefined();
	if (!record) return;

	await page.goto("/research");
	await expect(page.getByText(/\d+ results? from public data/i)).toBeVisible({
		timeout: 30_000,
	});
	await page.getByRole("searchbox").fill(record.title);
	await page.getByRole("button", { name: "Search" }).click();
	await expect(
		page.getByText("1 result from public data", { exact: true }),
	).toBeVisible({ timeout: 30_000 });
	await expect(page.getByRole("heading", { name: record.title })).toBeVisible();

	await page.goto(record.url);
	await expect(page.getByRole("heading", { name: record.title })).toBeVisible();
	await expect(page.getByRole("link", { name: /Back to all research/i })).toBeVisible();
});

test("researcher profile routes render database-backed public details", async ({
	page,
	request,
}) => {
	const response = await request.post("/api/search", {
		headers: { Accept: "application/json" },
		data: {
			filters: { entityTypes: ["researcher"] },
			page: 1,
			pageSize: 1,
		},
	});
	expect(response.ok()).toBe(true);
	const payload = (await response.json()) as {
		data: { items: Array<{ title: string; url: string }> };
	};
	const researcher = payload.data.items[0];
	expect(researcher).toBeDefined();
	if (!researcher) return;

	await page.goto(researcher.url);
	await expect(page.getByRole("heading", { name: researcher.title })).toBeVisible();
	await expect(
		page.getByRole("link", { name: /Back to all researchers/i }),
	).toBeVisible();
});
