import { createFileRoute } from "@tanstack/react-router";
import {
	DetailPlaceholderPage,
	detailPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/researchers/$profileId")({
	head: () => publicHead(pageSeo.researcherProfile),
	component: ResearcherProfilePage,
});

function ResearcherProfilePage() {
	const { profileId } = Route.useParams();

	return (
		<DetailPlaceholderPage config={detailPages.researcher} param={profileId} />
	);
}
