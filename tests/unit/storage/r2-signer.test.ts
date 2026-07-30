import { describe, expect, it } from "vitest";
import type { RepositoryFile } from "#/domain/index.ts";
import {
	createR2ObjectStorageSigner,
	normalizeR2StorageConfig,
	R2StorageConfigurationError,
	R2StorageValidationError,
} from "#/infrastructure/storage/r2-signer.ts";

const baseConfig = {
	accountId: "account-id",
	accessKeyId: "access-key-id",
	secretAccessKey: "secret-access-key",
	bucket: "oau-ippto-research",
	endpoint: "https://account-id.r2.cloudflarestorage.com",
	signedUploadExpiresSeconds: 300,
	signedDownloadExpiresSeconds: 120,
	maxUploadBytes: 1_000_000,
	allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg"],
	now: () => new Date("2026-07-30T10:00:00.000Z"),
	randomId: () => "fixed-id",
};

describe("R2 object storage signer", () => {
	it("creates a short-lived PUT URL for direct browser uploads", async () => {
		const signer = createR2ObjectStorageSigner(baseConfig);

		const signedUrl = await signer.createUploadUrl({
			filename: "Quarter 1 Report.pdf",
			mimeType: "application/pdf",
			fileSizeBytes: 250_000,
			checksum: "sha256:abc1234567890",
			purpose: "research_document",
			uploaderId: "staff-123",
			researchRecordId: "record-456",
		});
		const url = new URL(signedUrl.url);

		expect(signedUrl.method).toBe("PUT");
		expect(signedUrl.objectKey).toBe(
			"research-repository/research_document/record-456/staff-123/fixed-id-Quarter-1-Report.pdf",
		);
		expect(signedUrl.expiresAt.toISOString()).toBe("2026-07-30T10:05:00.000Z");
		expect(signedUrl.headers).toMatchObject({
			"content-type": "application/pdf",
			"x-amz-meta-filename": "Quarter 1 Report.pdf",
			"x-amz-meta-purpose": "research_document",
			"x-amz-meta-uploader-id": "staff-123",
			"x-amz-meta-research-record-id": "record-456",
		});
		expect(url.hostname).toBe("account-id.r2.cloudflarestorage.com");
		expect(url.pathname).toBe(
			"/oau-ippto-research/research-repository/research_document/record-456/staff-123/fixed-id-Quarter-1-Report.pdf",
		);
		expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
		expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
		expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain("host");
		expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain(
			"content-type",
		);
		expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[a-f0-9]{64}$/);
	});

	it("creates a private GET URL from stored metadata without exposing file bytes", async () => {
		const signer = createR2ObjectStorageSigner(baseConfig);
		const file = createRepositoryFile({
			objectKey: "research-repository/publication/record-456/staff-123/file.pdf",
		});

		const signedUrl = await signer.createDownloadUrl(file);
		const url = new URL(signedUrl.url);

		expect(signedUrl.method).toBe("GET");
		expect(signedUrl.headers).toBeUndefined();
		expect(signedUrl.objectKey).toBe(file.objectKey);
		expect(signedUrl.expiresAt.toISOString()).toBe("2026-07-30T10:02:00.000Z");
		expect(url.searchParams.get("X-Amz-Expires")).toBe("120");
		expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[a-f0-9]{64}$/);
	});

	it("rejects uploads with a disallowed MIME type or mismatched extension", async () => {
		const signer = createR2ObjectStorageSigner(baseConfig);

		await expect(
			signer.createUploadUrl({
				filename: "report.pdf",
				mimeType: "text/html",
				fileSizeBytes: 1_000,
				purpose: "research_document",
				uploaderId: "staff-123",
			}),
		).rejects.toBeInstanceOf(R2StorageValidationError);

		await expect(
			signer.createUploadUrl({
				filename: "report.exe",
				mimeType: "application/pdf",
				fileSizeBytes: 1_000,
				purpose: "research_document",
				uploaderId: "staff-123",
			}),
		).rejects.toBeInstanceOf(R2StorageValidationError);
	});

	it("rejects oversized uploads and files outside the configured bucket", async () => {
		const signer = createR2ObjectStorageSigner(baseConfig);

		await expect(
			signer.createUploadUrl({
				filename: "report.pdf",
				mimeType: "application/pdf",
				fileSizeBytes: 1_000_001,
				purpose: "research_document",
				uploaderId: "staff-123",
			}),
		).rejects.toBeInstanceOf(R2StorageValidationError);

		await expect(
			signer.createDownloadUrl(
				createRepositoryFile({
					bucket: "another-bucket",
					objectKey: "research-repository/file.pdf",
				}),
			),
		).rejects.toBeInstanceOf(R2StorageValidationError);
	});

	it("requires complete R2 configuration and short-lived expiries", () => {
		expect(() =>
			normalizeR2StorageConfig({
				...baseConfig,
				accessKeyId: "",
			}),
		).toThrow(R2StorageConfigurationError);

		expect(() =>
			normalizeR2StorageConfig({
				...baseConfig,
				signedUploadExpiresSeconds: 901,
			}),
		).toThrow(R2StorageConfigurationError);
	});
});

function createRepositoryFile(
	overrides: Partial<RepositoryFile> = {},
): RepositoryFile {
	return {
		id: "file-123",
		objectKey: "research-repository/file.pdf",
		bucket: "oau-ippto-research",
		filename: "file.pdf",
		mimeType: "application/pdf",
		fileSizeBytes: 1024,
		checksum: null,
		accessLevel: "private",
		purpose: "research_document",
		uploaderId: "staff-123",
		researchRecordId: "record-456",
		publicationId: null,
		metadata: {},
		createdAt: new Date("2026-07-30T10:00:00.000Z"),
		updatedAt: new Date("2026-07-30T10:00:00.000Z"),
		...overrides,
	};
}
