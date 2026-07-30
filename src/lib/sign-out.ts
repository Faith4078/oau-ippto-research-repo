"use client";

export async function signOutAndRedirectHome() {
	const response = await fetch("/api/auth/sign-out", {
		body: JSON.stringify({}),
		credentials: "include",
		headers: {
			"content-type": "application/json",
		},
		method: "POST",
	});

	if (!response.ok) {
		throw new Error("Sign out failed.");
	}

	window.location.replace("/");
}
