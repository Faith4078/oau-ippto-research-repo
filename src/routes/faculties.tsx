import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/faculties")({
	head: () => publicHead(pageSeo.faculties),
	component: FacultiesPage,
});

function FacultiesPage() {
	return <CollectionPage config={collectionPages.faculties} />;
}
