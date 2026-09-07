export function formatDashboardName(persona: string) {
	const name = persona
		.replace(/\s*\([^)]*\)\s*$/, "")
		.replace(/^(?:dr|prof|mr|mrs|ms)\.?\s+/i, "")
		.trim();
	const parts = name.split(/\s+/).filter(Boolean);
	if (parts.length < 2) return name;
	const firstName = parts[0];
	const lastName = parts.at(-1);
	if (/^[A-Z]\.?$/i.test(firstName) && lastName) {
		return `${lastName} ${firstName.charAt(0).toUpperCase()}.`;
	}
	return lastName
		? `${firstName} ${lastName.charAt(0).toUpperCase()}.`
		: firstName;
}
