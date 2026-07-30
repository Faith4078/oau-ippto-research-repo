import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/reports")({
	head: () => publicHead(pageSeo.reports),
	component: ReportsPage,
});

function ReportsPage() {
	return <CollectionPage config={collectionPages.reports} />;
}
