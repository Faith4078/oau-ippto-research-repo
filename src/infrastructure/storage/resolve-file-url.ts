import { eq } from "drizzle-orm";

import type { Database } from "#/infrastructure/db/index.ts";
import { schema } from "#/infrastructure/db/index.ts";

import { createR2ObjectStorageSigner } from "./r2-signer.ts";

/**
 * Resolves a short-lived, signed download URL for a file that is not tied to a
 * research record (for example a profile avatar), given only its `files.id`.
 *
 * Returns `null` instead of throwing when the file cannot be found or the
 * object storage signer is not configured, so callers can render gracefully
 * without an image rather than fail the whole request.
 */
export async function resolveFileDownloadUrl(
	database: Database,
	fileId: string,
): Promise<string | null> {
	try {
		const [file] = await database
			.select()
			.from(schema.files)
			.where(eq(schema.files.id, fileId));

		if (!file) {
			return null;
		}

		const signed = await createR2ObjectStorageSigner().createDownloadUrl({
			id: file.id,
			objectKey: file.objectKey,
			bucket: file.bucket,
			filename: file.filename,
			mimeType: file.mimeType,
			fileSizeBytes: file.fileSizeBytes,
			checksum: file.checksum,
			accessLevel: file.accessLevel,
			purpose: file.purpose,
			uploaderId: file.uploaderId,
			researchRecordId: file.researchRecordId,
			publicationId: file.publicationId,
			metadata: file.metadata,
			createdAt: file.createdAt,
			updatedAt: file.updatedAt,
		});

		return signed.url;
	} catch {
		return null;
	}
}
