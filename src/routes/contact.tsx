import { createFileRoute } from "@tanstack/react-router";
import {
	ContactPageContent,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/contact")({
	head: () => publicHead(pageSeo.contact),
	component: ContactPage,
});

function ContactPage() {
	return <ContactPageContent />;
}
