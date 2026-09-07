"use client";

import { createFileRoute } from "@tanstack/react-router";

import {
	CollectionPage,
	collectionPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/research/")({
	head: () => publicHead(pageSeo.research),
	component: ResearchCataloguePage,
});

function ResearchCataloguePage() {
	return <CollectionPage config={collectionPages.research} />;
}
