import { createFileRoute } from "@tanstack/react-router";

import { requireDatabaseUrl } from "#/db/env.ts";
import { createDatabase } from "#/infrastructure/db/index.ts";
import { DrizzleUserProfileRepository } from "#/infrastructure/db/user-profile-repository.ts";
import { resolveFileDownloadUrl } from "#/infrastructure/storage/resolve-file-url.ts";
import { readAuthSession } from "#/lib/auth-server.ts";
import {
	userProfileUpdateInputSchema,
	validatePayload,
} from "#/lib/validation.ts";

import { jsonError, readJsonBody } from "../-helpers.ts";

export const Route = createFileRoute("/api/dashboard/profile")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);

				if (session.status !== "authenticated") {
					return unauthenticated();
				}

				const user = session.session.user;
				const database = createDatabase(requireDatabaseUrl());
				const repository = new DrizzleUserProfileRepository(database);
				const profile = await repository.findByUserId(user.id);
				const avatarUrl = profile?.avatarFileId
					? await resolveFileDownloadUrl(database, profile.avatarFileId)
					: null;

				return Response.json({
					data: {
						userId: user.id,
						name: user.name,
						email: user.email,
						staffId: user.staffId,
						title: profile?.title ?? null,
						bio: profile?.bio ?? null,
						researchInterests: profile?.researchInterests ?? [],
						orcid: profile?.orcid ?? null,
						phone: profile?.phone ?? null,
						publicEmail: profile?.publicEmail ?? null,
						recoveryEmail: profile?.recoveryEmail ?? null,
						avatarFileId: profile?.avatarFileId ?? null,
						avatarUrl,
					},
				});
			},
			PATCH: async ({ request }: { request: Request }) => {
				const session = await readAuthSession(request);

				if (session.status !== "authenticated") {
					return unauthenticated();
				}

				const payload = await readJsonBody(request);
				const input = validatePayload(userProfileUpdateInputSchema, payload);

				if (!input.ok) {
					return jsonError(input.error);
				}

				const database = createDatabase(requireDatabaseUrl());
				const repository = new DrizzleUserProfileRepository(database);
				const profile = await repository.upsertForUser(
					session.session.user.id,
					input.value,
				);
				const avatarUrl = profile.avatarFileId
					? await resolveFileDownloadUrl(database, profile.avatarFileId)
					: null;

				return Response.json({
					data: {
						userId: profile.userId,
						title: profile.title,
						bio: profile.bio,
						researchInterests: profile.researchInterests ?? [],
						orcid: profile.orcid,
						phone: profile.phone,
						publicEmail: profile.publicEmail,
						recoveryEmail: profile.recoveryEmail,
						avatarFileId: profile.avatarFileId,
						avatarUrl,
					},
				});
			},
		},
	},
});

function unauthenticated() {
	return Response.json(
		{
			error: {
				code: "AUTHENTICATION_REQUIRED",
				message: "Sign in to manage your profile.",
			},
		},
		{ status: 401 },
	);
}
