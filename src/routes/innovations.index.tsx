import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/innovations/")({
	head: () => publicHead(pageSeo.innovations),
	component: InnovationsPage,
});

function InnovationsPage() {
	return <CollectionPage config={collectionPages.innovations} />;
}
