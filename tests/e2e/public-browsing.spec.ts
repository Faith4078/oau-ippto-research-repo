import { expect, test } from "@playwright/test";

const collectionPages = [
	{
		path: "/research",
		heading: /Search Public Research Outputs/i,
		search: /Search by title, author, keyword, or abstract/i,
		result: /Smart energy systems for resilient communities/i,
	},
	{
		path: "/researchers",
		heading: /Find Experts Across the University/i,
		search: /Search researchers, interests, or departments/i,
		result: /Prof\. Amina Adebayo/i,
	},
	{
		path: "/reports",
		heading: /Reports and Statistics/i,
		search: /Search reports, statistics, years, or faculties/i,
		result: /Public research output summary/i,
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
		await expect(page.getByText(pageConfig.result)).toBeVisible();
	});
}

test("public detail pages expose contextual navigation", async ({ page }) => {
	await page.goto("/research/smart-energy-systems");

	await expect(
		page.getByRole("heading", { name: /Smart Energy Systems/i }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: /Back to research/i })).toBeVisible();
	await expect(page.getByText(/Related records/i)).toBeVisible();
});
