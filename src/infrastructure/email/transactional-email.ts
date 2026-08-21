export type TransactionalEmail = {
	to: string;
	subject: string;
	text: string;
	html: string;
};

export type TransactionalEmailSender = {
	send(message: TransactionalEmail): Promise<void>;
};

type EmailEnvironment = Partial<Record<string, string | undefined>>;

export function createTransactionalEmailSender(
	environment: EmailEnvironment = process.env,
	fetchImplementation: typeof fetch = fetch,
): TransactionalEmailSender {
	const apiUrl = environment.EMAIL_API_URL?.trim();
	const apiToken = environment.EMAIL_API_TOKEN?.trim();
	const from = environment.EMAIL_FROM?.trim();

	if (!apiUrl || !apiToken || !from) {
		throw new Error(
			"Transactional email requires EMAIL_API_URL, EMAIL_API_TOKEN, and EMAIL_FROM.",
		);
	}

	return {
		async send(message) {
			const response = await fetchImplementation(apiUrl, {
				body: JSON.stringify({ ...message, from }),
				headers: {
					accept: "application/json",
					authorization: `Bearer ${apiToken}`,
					"content-type": "application/json",
				},
				method: "POST",
			});

			if (!response.ok) {
				throw new Error(
					`Transactional email provider returned ${response.status}.`,
				);
			}
		},
	};
}

export function renderPasswordResetEmail(input: {
	to: string;
	resetUrl: string;
}): TransactionalEmail {
	const escapedUrl = escapeHtml(input.resetUrl);
	return {
		to: input.to,
		subject: "Reset your OAU IPTTO Repository password",
		text: `Use this link to reset your OAU IPTTO Research Repository password. The link expires in one hour: ${input.resetUrl}`,
		html: `<p>Use the link below to reset your OAU IPTTO Research Repository password. The link expires in one hour.</p><p><a href="${escapedUrl}">Reset password</a></p>`,
	};
}

export function renderAccountStatusEmail(input: {
	to: string;
	status: "active" | "rejected" | "suspended" | "deactivated";
	reason: string | null;
}): TransactionalEmail {
	const labels = {
		active: "active",
		rejected: "rejected",
		suspended: "suspended",
		deactivated: "deactivated",
	} as const;
	const label = labels[input.status];
	const reason = input.reason ? ` Reason: ${input.reason}` : "";
	const text = `Your OAU IPTTO Research Repository account is now ${label}.${reason}`;

	return {
		to: input.to,
		subject: `Repository account ${label}`,
		text,
		html: `<p>${escapeHtml(text)}</p>`,
	};
}

export function shouldExposePasswordResetDebugLink(
	environment: EmailEnvironment = process.env,
) {
	return (
		environment.NODE_ENV !== "production" &&
		environment.PASSWORD_RESET_DEBUG === "true"
	);
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}
