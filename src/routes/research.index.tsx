"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
	type CardItem,
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
	const [liveItems, setLiveItems] = useState<Array<CardItem>>([]);

	useEffect(() => {
		let cancelled = false;

		async function loadLiveResearch() {
			try {
				const response = await fetch("/api/public-research");

				if (!response.ok) {
					return;
				}

				const payload = (await response.json()) as {
					data?: Array<CardItem>;
				};

				if (!cancelled) {
					setLiveItems(payload.data ?? []);
				}
			} catch {
				if (!cancelled) {
					setLiveItems([]);
				}
			}
		}

		void loadLiveResearch();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<CollectionPage config={collectionPages.research} liveItems={liveItems} />
	);
}
