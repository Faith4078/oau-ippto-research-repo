import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/research-areas")({
	head: () => publicHead(pageSeo.researchAreas),
	component: ResearchAreasPage,
});

function ResearchAreasPage() {
	return <CollectionPage config={collectionPages.researchAreas} />;
}
