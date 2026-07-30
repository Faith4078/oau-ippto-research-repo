import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/patents")({
	head: () => publicHead(pageSeo.patents),
	component: PatentsPage,
});

function PatentsPage() {
	return <CollectionPage config={collectionPages.patents} />;
}
