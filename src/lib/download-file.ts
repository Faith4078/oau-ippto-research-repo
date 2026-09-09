/**
 * Triggers a browser download of `content` as a plain-text file named
 * `filename`. Uses the standard `Blob` + temporary object URL + programmatic
 * `<a>` click pattern — no backend endpoint required.
 */
export function downloadTextFile(
	filename: string,
	content: string,
	mimeType = "text/plain;charset=utf-8",
) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);

	try {
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	} finally {
		URL.revokeObjectURL(url);
	}
}

/** Replaces characters that are unsafe in a downloaded filename. */
export function toSafeFileSlug(value: string, fallback = "research-record") {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug || fallback;
}
