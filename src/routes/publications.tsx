import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/publications")({
	head: () => publicHead(pageSeo.publications),
	component: PublicationsPage,
});

function PublicationsPage() {
	return <CollectionPage config={collectionPages.publications} />;
}
