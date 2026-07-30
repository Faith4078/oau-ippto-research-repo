# Background Jobs

The repository keeps expensive processing behind `src/application/jobs.ts`.

Current job types:

- `ai_summary`
- `keyword_extraction`
- `search_indexing`
- `document_metadata_extraction`

Current statuses:

- `queued`
- `retried`
- `completed`
- `failed`

The runtime infrastructure adapter is `PostgresJobQueueRepository`, backed by the `background_jobs` table. The in-memory adapter remains available for unit tests and isolated local service tests.

Routes enqueue follow-up work after successful research submissions and upload confirmations so API requests do not perform AI, indexing, or document parsing work inline.

Failed-job visibility is exposed through the background jobs service and requires the `super_administrator` permission surface through `admin:manage_system_settings`.
