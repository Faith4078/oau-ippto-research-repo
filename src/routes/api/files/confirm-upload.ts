import { createFileRoute } from "@tanstack/react-router";
import { fail } from "#/application/result.ts";
import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";
import { readAuthSession } from "#/lib/auth-server.ts";

import {
	actorFromSession,
	jsonResult,
	parseObjectKey,
	readJsonBody,
} from "../-helpers.ts";

export const Route = createFileRoute("/api/files/confirm-upload")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const services = createRuntimeApplicationServices();
				const session = await readAuthSession(request);
				const payload = await readJsonBody(request);
				const objectKey = parseObjectKey(payload);

				if (!objectKey) {
					return jsonResult(
						fail("VALIDATION_FAILED", "Uploaded object key is required."),
					);
				}

				const result = await services.researchWorkflow.confirmUploadedFile(
					actorFromSession(session),
					payload,
					objectKey,
				);

				if (result.ok) {
					await services.backgroundJobs.enqueue({
						type: "document_metadata_extraction",
						payload: {
							fileId: result.value.id,
							objectKey: result.value.objectKey,
							researchRecordId: result.value.researchRecordId,
						},
					});
					await services.backgroundJobs.enqueue({
						type: "keyword_extraction",
						payload: {
							fileId: result.value.id,
							researchRecordId: result.value.researchRecordId,
						},
					});
				}

				return jsonResult(result);
			},
		},
	},
});
