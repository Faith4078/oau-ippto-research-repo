import { createFileRoute } from "@tanstack/react-router";

import { createRuntimeApplicationServices } from "#/infrastructure/app-services.ts";

import { asEntityId, jsonResult } from "./-helpers.ts";

export const Route = createFileRoute("/api/related-records")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const services = createRuntimeApplicationServices();
				const url = new URL(request.url);

				return jsonResult(
					await services.innovationManagement.listPublicRelatedRecords({
						researchRecordId: optionalEntityId(
							url.searchParams.get("researchRecordId"),
						),
						innovationId: optionalEntityId(
							url.searchParams.get("innovationId"),
						),
						patentId: optionalEntityId(url.searchParams.get("patentId")),
					}),
				);
			},
		},
	},
});

function optionalEntityId(value: string | null) {
	return value ? asEntityId(value) : null;
}
