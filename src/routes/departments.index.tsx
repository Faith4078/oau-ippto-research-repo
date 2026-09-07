import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/departments/")({
	head: () => publicHead(pageSeo.departments),
	component: DepartmentsPage,
});

function DepartmentsPage() {
	return <CollectionPage config={collectionPages.departments} />;
}
