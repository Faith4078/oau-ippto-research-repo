export function formatDashboardName(persona: string) {
	return persona
		.replace(/\s*\([^)]*\)\s*$/, "")
		.replace(/^(?:dr|prof|mr|mrs|ms)\.?\s+/i, "")
		.trim();
}
