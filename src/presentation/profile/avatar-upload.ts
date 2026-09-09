import type { SignedUploadRequest } from "#/lib/validation.ts";

type ApiError = {
	error?: {
		message?: string;
		code?: string;
	};
};

type ApiSuccess<T> = {
	data: T;
};

type Fetcher = typeof fetch;

type SignedUrlResponse = {
	url: string;
	method: "PUT";
	expiresAt: string | Date;
	headers?: Record<string, string>;
	objectKey: string;
};

type UploadedFile = {
	id: string;
};

/**
 * Uploads a profile picture directly to object storage using the same
 * three-request pattern as research document uploads: request a signed
 * upload URL, PUT the file to it, then confirm the upload to create the
 * `files` row. Returns the new file's id, ready to be saved as the
 * profile's `avatarFileId`.
 */
export async function uploadAvatarWithDirectUpload(
	file: File,
	fetcher: Fetcher = fetch,
): Promise<string> {
	const metadata: SignedUploadRequest["file"] = {
		filename: file.name,
		mimeType: file.type || "application/octet-stream",
		fileSizeBytes: file.size,
		checksum: null,
		accessLevel: "public",
		purpose: "profile_image",
	};

	const signedUpload = await postJson<SignedUrlResponse>(
		"/api/files/signed-upload-url",
		{ file: metadata },
		fetcher,
	);

	const uploadResponse = await fetcher(signedUpload.url, {
		method: signedUpload.method,
		headers: signedUpload.headers ?? {},
		body: file,
	});

	if (!uploadResponse.ok) {
		throw new Error(
			"The profile picture could not be uploaded. Please try again.",
		);
	}

	const confirmed = await postJson<UploadedFile>(
		"/api/files/confirm-upload",
		{ file: metadata, objectKey: signedUpload.objectKey },
		fetcher,
	);

	return confirmed.id;
}

async function postJson<T>(
	url: string,
	payload: unknown,
	fetcher: Fetcher,
): Promise<T> {
	const response = await fetcher(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const body = (await response.json().catch(() => ({}))) as
		| ApiSuccess<T>
		| ApiError;

	if (!response.ok || !("data" in body)) {
		let message = "The request could not be completed.";

		const apiError = "error" in body ? body.error : null;

		if (apiError?.message) {
			message = apiError.message;
		}

		throw new Error(message);
	}

	return body.data;
}
