import { createFileRoute } from "@tanstack/react-router";
import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/news")({
	head: () => publicHead(pageSeo.news),
	component: NewsPage,
});

function NewsPage() {
	return <CollectionPage config={collectionPages.news} />;
}
