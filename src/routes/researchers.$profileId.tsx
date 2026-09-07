import { createFileRoute } from "@tanstack/react-router";
import {
	LivePublicRecordPage,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/researchers/$profileId")({
	head: () => publicHead(pageSeo.researcherProfile),
	component: ResearcherProfilePage,
});

function ResearcherProfilePage() {
	const { profileId } = Route.useParams();

	return <LivePublicRecordPage id={profileId} type="researcher" />;
}
