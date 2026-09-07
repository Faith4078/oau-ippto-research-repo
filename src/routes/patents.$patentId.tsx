import { createFileRoute } from "@tanstack/react-router";
import {
	LivePublicRecordPage,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/patents/$patentId")({
	head: () => publicHead(pageSeo.patentDetail),
	component: PatentDetailPage,
});

function PatentDetailPage() {
	const { patentId } = Route.useParams();

	return <LivePublicRecordPage id={patentId} type="patent" />;
}
