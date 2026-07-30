import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/researchers")({
	head: () => publicHead(pageSeo.researchers),
	component: ResearchersPage,
});

function ResearchersPage() {
	return <CollectionPage config={collectionPages.researchers} />;
}
