import { createFileRoute } from "@tanstack/react-router";
import {
	FaqPageContent,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/faq")({
	head: () => publicHead(pageSeo.faq),
	component: FaqPage,
});

function FaqPage() {
	return <FaqPageContent />;
}
