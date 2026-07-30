import type {
	ObjectStorageSigner,
	SignedUrl,
} from "#/application/research-workflow.ts";
import type { RepositoryFile } from "#/domain/index.ts";

const DEFAULT_UPLOAD_EXPIRES_SECONDS = 300;
const DEFAULT_DOWNLOAD_EXPIRES_SECONDS = 300;
const MAX_SHORT_LIVED_EXPIRES_SECONDS = 900;
const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
] as const;
const DEFAULT_ALLOWED_EXTENSIONS_BY_MIME_TYPE: Record<string, string[]> = {
	"application/pdf": [".pdf"],
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
};
const AWS_ALGORITHM = "AWS4-HMAC-SHA256";
const AWS_REGION = "auto";
const AWS_SERVICE = "s3";
const SIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

export type R2StorageConfig = {
	accountId: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	endpoint: string;
	signedUploadExpiresSeconds: number;
	signedDownloadExpiresSeconds: number;
	maxUploadBytes: number;
	allowedMimeTypes: string[];
	allowedExtensionsByMimeType: Record<string, string[]>;
	keyPrefix?: string;
	now?: () => Date;
	randomId?: () => string;
};

export type R2StorageConfigInput = {
	accountId?: string;
	bucket?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	endpoint?: string;
	signedUploadExpiresSeconds?: string | number;
	signedDownloadExpiresSeconds?: string | number;
	maxUploadBytes?: string | number;
	allowedMimeTypes?: string | string[];
	allowedExtensionsByMimeType?: Record<string, string[]>;
	keyPrefix?: string;
	now?: () => Date;
	randomId?: () => string;
};

export class R2StorageConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "R2StorageConfigurationError";
	}
}

export class R2StorageValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "R2StorageValidationError";
	}
}

export function getR2StorageConfig(
	env: NodeJS.ProcessEnv = process.env,
): R2StorageConfig {
	return normalizeR2StorageConfig({
		accountId: env.R2_ACCOUNT_ID,
		bucket: env.R2_BUCKET,
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		endpoint:
			env.R2_ENDPOINT ??
			(env.R2_ACCOUNT_ID
				? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
				: undefined),
		signedUploadExpiresSeconds: env.R2_SIGNED_UPLOAD_EXPIRES_SECONDS,
		signedDownloadExpiresSeconds: env.R2_SIGNED_DOWNLOAD_EXPIRES_SECONDS,
		maxUploadBytes: env.MAX_UPLOAD_BYTES,
		allowedMimeTypes: env.ALLOWED_UPLOAD_MIME_TYPES,
	});
}

export function normalizeR2StorageConfig(
	input: R2StorageConfigInput,
): R2StorageConfig {
	const allowedMimeTypes = normalizeList(input.allowedMimeTypes).length
		? normalizeList(input.allowedMimeTypes)
		: [...DEFAULT_ALLOWED_MIME_TYPES];
	const allowedExtensionsByMimeType =
		input.allowedExtensionsByMimeType ??
		DEFAULT_ALLOWED_EXTENSIONS_BY_MIME_TYPE;

	const config: R2StorageConfig = {
		accountId: requireText(input.accountId, "R2_ACCOUNT_ID"),
		bucket: requireText(input.bucket, "R2_BUCKET"),
		accessKeyId: requireText(input.accessKeyId, "R2_ACCESS_KEY_ID"),
		secretAccessKey: requireText(input.secretAccessKey, "R2_SECRET_ACCESS_KEY"),
		endpoint: requireText(input.endpoint, "R2_ENDPOINT").replace(/\/+$/, ""),
		signedUploadExpiresSeconds: parseShortLivedSeconds(
			input.signedUploadExpiresSeconds,
			"R2_SIGNED_UPLOAD_EXPIRES_SECONDS",
			DEFAULT_UPLOAD_EXPIRES_SECONDS,
		),
		signedDownloadExpiresSeconds: parseShortLivedSeconds(
			input.signedDownloadExpiresSeconds,
			"R2_SIGNED_DOWNLOAD_EXPIRES_SECONDS",
			DEFAULT_DOWNLOAD_EXPIRES_SECONDS,
		),
		maxUploadBytes: parsePositiveInteger(
			input.maxUploadBytes,
			"MAX_UPLOAD_BYTES",
			DEFAULT_MAX_UPLOAD_BYTES,
		),
		allowedMimeTypes,
		allowedExtensionsByMimeType,
		keyPrefix: input.keyPrefix,
		now: input.now,
		randomId: input.randomId,
	};

	assertKnownExtensionPolicy(config);

	return config;
}

export function createR2ObjectStorageSigner(
	config: R2StorageConfigInput = getR2StorageConfig(),
): ObjectStorageSigner {
	const normalizedConfig = normalizeR2StorageConfig(config);

	return {
		async createUploadUrl(input) {
			validateUploadRequest(input, normalizedConfig);

			const objectKey = createObjectKey(input, normalizedConfig);
			const headers = createUploadHeaders(input);

			return presignR2Request({
				config: normalizedConfig,
				method: "PUT",
				objectKey,
				expiresSeconds: normalizedConfig.signedUploadExpiresSeconds,
				headers,
			});
		},

		async createDownloadUrl(file) {
			validateDownloadRequest(file, normalizedConfig);

			return presignR2Request({
				config: normalizedConfig,
				method: "GET",
				objectKey: file.objectKey,
				expiresSeconds: normalizedConfig.signedDownloadExpiresSeconds,
				headers: {},
			});
		},
	};
}

function validateUploadRequest(
	input: Parameters<ObjectStorageSigner["createUploadUrl"]>[0],
	config: R2StorageConfig,
) {
	if (input.fileSizeBytes > config.maxUploadBytes) {
		throw new R2StorageValidationError(
			`File size exceeds MAX_UPLOAD_BYTES (${config.maxUploadBytes}).`,
		);
	}

	if (!config.allowedMimeTypes.includes(input.mimeType)) {
		throw new R2StorageValidationError(
			`MIME type is not allowed for R2 upload: ${input.mimeType}.`,
		);
	}

	const extension = getFilenameExtension(input.filename);
	const allowedExtensions =
		config.allowedExtensionsByMimeType[input.mimeType] ?? [];

	if (!allowedExtensions.includes(extension)) {
		throw new R2StorageValidationError(
			`File extension ${extension || "(none)"} does not match ${input.mimeType}.`,
		);
	}
}

function validateDownloadRequest(
	file: RepositoryFile,
	config: R2StorageConfig,
) {
	if (file.bucket !== config.bucket) {
		throw new R2StorageValidationError(
			"Cannot sign a download URL for a file outside the configured R2 bucket.",
		);
	}

	if (!file.objectKey || file.objectKey.includes("..")) {
		throw new R2StorageValidationError("File object key is invalid.");
	}
}

function createObjectKey(
	input: Parameters<ObjectStorageSigner["createUploadUrl"]>[0],
	config: R2StorageConfig,
) {
	const prefix = sanitizePathSegment(config.keyPrefix ?? "research-repository");
	const purpose = sanitizePathSegment(input.purpose);
	const recordSegment = sanitizePathSegment(
		input.researchRecordId ?? "unassigned",
	);
	const uploaderSegment = sanitizePathSegment(input.uploaderId);
	const uniqueId = sanitizePathSegment(
		config.randomId?.() ?? globalThis.crypto.randomUUID(),
	);
	const filename = sanitizeFilename(input.filename);

	return [
		prefix,
		purpose,
		recordSegment,
		uploaderSegment,
		`${uniqueId}-${filename}`,
	].join("/");
}

function createUploadHeaders(
	input: Parameters<ObjectStorageSigner["createUploadUrl"]>[0],
) {
	const headers: Record<string, string> = {
		"content-type": input.mimeType,
		"x-amz-meta-filename": input.filename,
		"x-amz-meta-purpose": input.purpose,
		"x-amz-meta-uploader-id": input.uploaderId,
	};

	if (input.checksum) {
		headers["x-amz-meta-checksum"] = input.checksum;
	}

	if (input.researchRecordId) {
		headers["x-amz-meta-research-record-id"] = input.researchRecordId;
	}

	return headers;
}

async function presignR2Request(input: {
	config: R2StorageConfig;
	method: SignedUrl["method"];
	objectKey: string;
	expiresSeconds: number;
	headers: Record<string, string>;
}): Promise<SignedUrl> {
	const now = input.config.now?.() ?? new Date();
	const amzDate = formatAmzDate(now);
	const dateStamp = amzDate.slice(0, 8);
	const credentialScope = `${dateStamp}/${AWS_REGION}/${AWS_SERVICE}/aws4_request`;
	const endpoint = new URL(input.config.endpoint);
	const canonicalUri = `/${encodePathSegment(input.config.bucket)}/${encodeObjectKey(
		input.objectKey,
	)}`;
	const signedHeaders = getSignedHeaders(input.headers);
	const query = new URLSearchParams({
		"X-Amz-Algorithm": AWS_ALGORITHM,
		"X-Amz-Credential": `${input.config.accessKeyId}/${credentialScope}`,
		"X-Amz-Date": amzDate,
		"X-Amz-Expires": String(input.expiresSeconds),
		"X-Amz-SignedHeaders": signedHeaders,
	});
	const canonicalQueryString = createCanonicalQueryString(query);
	const canonicalHeaders = createCanonicalHeaders(endpoint.host, input.headers);
	const canonicalRequest = [
		input.method,
		canonicalUri,
		canonicalQueryString,
		canonicalHeaders,
		signedHeaders,
		SIGNED_PAYLOAD,
	].join("\n");
	const stringToSign = [
		AWS_ALGORITHM,
		amzDate,
		credentialScope,
		await sha256Hex(canonicalRequest),
	].join("\n");
	const signingKey = await createSigningKey(
		input.config.secretAccessKey,
		dateStamp,
	);
	const signature = await hmacHex(signingKey, stringToSign);

	query.set("X-Amz-Signature", signature);

	const url = new URL(
		`${canonicalUri}?${createCanonicalQueryString(query)}`,
		endpoint,
	);

	return {
		url: url.toString(),
		method: input.method,
		expiresAt: new Date(now.getTime() + input.expiresSeconds * 1000),
		headers: input.method === "PUT" ? input.headers : undefined,
		objectKey: input.objectKey,
	};
}

function requireText(value: string | undefined, name: string) {
	if (!value?.trim()) {
		throw new R2StorageConfigurationError(`${name} is required.`);
	}

	return value.trim();
}

function parseShortLivedSeconds(
	value: string | number | undefined,
	name: string,
	defaultValue: number,
) {
	const seconds = parsePositiveInteger(value, name, defaultValue);

	if (seconds > MAX_SHORT_LIVED_EXPIRES_SECONDS) {
		throw new R2StorageConfigurationError(
			`${name} must be ${MAX_SHORT_LIVED_EXPIRES_SECONDS} seconds or less.`,
		);
	}

	return seconds;
}

function parsePositiveInteger(
	value: string | number | undefined,
	name: string,
	defaultValue: number,
) {
	if (value === undefined || value === "") {
		return defaultValue;
	}

	const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new R2StorageConfigurationError(
			`${name} must be a positive integer.`,
		);
	}

	return parsed;
}

function normalizeList(value: string | string[] | undefined) {
	if (Array.isArray(value)) {
		return value.map((item) => item.trim()).filter(Boolean);
	}

	return (
		value
			?.split(",")
			.map((item) => item.trim())
			.filter(Boolean) ?? []
	);
}

function assertKnownExtensionPolicy(config: R2StorageConfig) {
	for (const mimeType of config.allowedMimeTypes) {
		if (!config.allowedExtensionsByMimeType[mimeType]?.length) {
			throw new R2StorageConfigurationError(
				`No allowed file extensions configured for ${mimeType}.`,
			);
		}
	}
}

function sanitizeFilename(filename: string) {
	return filename
		.trim()
		.replace(/[/\\]/g, "-")
		.replace(/[^a-zA-Z0-9._-]/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 180);
}

function sanitizePathSegment(value: string) {
	return value
		.trim()
		.replace(/[^a-zA-Z0-9._-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 120);
}

function getFilenameExtension(filename: string) {
	const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);

	return match?.[0] ?? "";
}

function getSignedHeaders(headers: Record<string, string>) {
	return ["host", ...Object.keys(headers).map((header) => header.toLowerCase())]
		.sort()
		.join(";");
}

function createCanonicalHeaders(host: string, headers: Record<string, string>) {
	const normalizedHeaders = new Map<string, string>([
		["host", host],
		...Object.entries(headers).map(
			([name, value]) =>
				[name.toLowerCase(), value.trim().replace(/\s+/g, " ")] as const,
		),
	]);

	return Array.from(normalizedHeaders.entries())
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([name, value]) => `${name}:${value}\n`)
		.join("");
}

function createCanonicalQueryString(query: URLSearchParams) {
	return Array.from(query.entries())
		.sort(([leftKey, leftValue], [rightKey, rightValue]) =>
			leftKey === rightKey
				? leftValue.localeCompare(rightValue)
				: leftKey.localeCompare(rightKey),
		)
		.map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
		.join("&");
}

function encodeObjectKey(objectKey: string) {
	return objectKey.split("/").map(encodePathSegment).join("/");
}

function encodePathSegment(value: string) {
	return encodeRfc3986(value);
}

function encodeRfc3986(value: string) {
	return encodeURIComponent(value).replace(
		/[!'()*]/g,
		(character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}

function formatAmzDate(date: Date) {
	return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function createSigningKey(secretAccessKey: string, dateStamp: string) {
	const dateKey = await hmacBytes(`AWS4${secretAccessKey}`, dateStamp);
	const regionKey = await hmacBytes(dateKey, AWS_REGION);
	const serviceKey = await hmacBytes(regionKey, AWS_SERVICE);

	return hmacBytes(serviceKey, "aws4_request");
}

async function sha256Hex(value: string) {
	const bytes = await globalThis.crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);

	return toHex(bytes);
}

async function hmacBytes(
	key: string | ArrayBuffer,
	value: string,
): Promise<ArrayBuffer> {
	const cryptoKey = await globalThis.crypto.subtle.importKey(
		"raw",
		typeof key === "string" ? new TextEncoder().encode(key) : key,
		{ hash: "SHA-256", name: "HMAC" },
		false,
		["sign"],
	);

	return globalThis.crypto.subtle.sign(
		"HMAC",
		cryptoKey,
		new TextEncoder().encode(value),
	);
}

async function hmacHex(key: ArrayBuffer, value: string) {
	return toHex(await hmacBytes(key, value));
}

function toHex(bytes: ArrayBuffer) {
	return Array.from(new Uint8Array(bytes))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}
