/**
 * Seeds the live database with realistic, sober academic sample content so the
 * homepage's "Recently Published", "Innovation & Technology Transfer", and
 * "Patents & Intellectual Property" sections have real records to show.
 *
 * This is a one-time dev/demo seed, not a fully idempotent migration: it
 * writes a `seedBatch` marker (`SEED_BATCH_ID`) into the `metadata` column of
 * every row it creates, and refuses to run again if that marker is already
 * present anywhere in `research_records`. Re-running after changing
 * `SEED_BATCH_ID` below WILL insert a second batch of rows — don't do that
 * unless you mean to.
 *
 * Only inserts new rows. Never updates or deletes existing data.
 *
 * Usage: pnpm exec tsx scripts/seed-demo-content.ts
 */
import { randomBytes } from "node:crypto";

import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "#/infrastructure/db/schema.ts";

config({ path: [".env.local", ".env"], quiet: true });

const SEED_BATCH_ID = "demo-content-2026-09";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	process.stderr.write("DATABASE_URL is not set (checked .env.local/.env).\n");
	process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool, { schema });

function slugify(title: string): string {
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 480);
	return `${base}-${randomBytes(4).toString("hex")}`;
}

function randomToken(length: number): string {
	return randomBytes(length).toString("hex").slice(0, length).toUpperCase();
}

/** A date `monthsBack` months before today, as a YYYY-MM-DD string. */
function dateMonthsAgo(monthsBack: number, dayOfMonth = 12): string {
	const date = new Date();
	date.setUTCDate(1);
	date.setUTCMonth(date.getUTCMonth() - monthsBack);
	date.setUTCDate(dayOfMonth);
	return date.toISOString().slice(0, 10);
}

/** A timestamp `monthsBack` months before today. */
function timestampMonthsAgo(monthsBack: number, dayOfMonth = 12): Date {
	return new Date(`${dateMonthsAgo(monthsBack, dayOfMonth)}T09:00:00.000Z`);
}

type FacultySeed = { name: string; slug: string; code: string };
type DepartmentSeed = {
	name: string;
	slug: string;
	code: string;
	facultyName: string;
};

// Faculties/departments already present in the DB (Faculty of Technology,
// Faculty of Science, Faculty of Agriculture, and their four departments) are
// reused as-is and never re-created. These two are added only if missing, to
// cover disciplines (health, humanities) the existing organization chart
// doesn't have yet.
const facultiesToEnsure: FacultySeed[] = [
	{
		name: "College of Health Sciences",
		slug: "college-of-health-sciences",
		code: "CHS",
	},
	{
		name: "Faculty of Arts",
		slug: "faculty-of-arts",
		code: "ARTS",
	},
];

const departmentsToEnsure: DepartmentSeed[] = [
	{
		name: "Community Health",
		slug: "community-health",
		code: "CHS-CH",
		facultyName: "College of Health Sciences",
	},
	{
		name: "Linguistics and African Languages",
		slug: "linguistics-and-african-languages",
		code: "ARTS-LAL",
		facultyName: "Faculty of Arts",
	},
];

type AuthorSeed = { name: string; affiliation: string };

const authorPool: AuthorSeed[] = [
	{ name: "Dr. Folasade Ogundipe", affiliation: "Crop Production and Protection" },
	{ name: "Prof. Chukwuemeka Nwachukwu", affiliation: "Community Health" },
	{ name: "Dr. Aisha Balogun", affiliation: "Computer Science and Engineering" },
	{
		name: "Dr. Babatunde Fashola",
		affiliation: "Linguistics and African Languages",
	},
	{
		name: "Prof. Ngozi Eze",
		affiliation: "Electrical and Electronic Engineering",
	},
	{ name: "Dr. Rasheed Adigun", affiliation: "Microbiology" },
	{ name: "Dr. Kehinde Salako", affiliation: "Crop Production and Protection" },
	{ name: "Dr. Emeka Okoro", affiliation: "Community Health" },
	{ name: "Dr. Bimpe Fadeyi", affiliation: "Computer Science and Engineering" },
	{
		name: "Prof. Adeola Oyelaran",
		affiliation: "Linguistics and African Languages",
	},
	{
		name: "Dr. Suleiman Bello",
		affiliation: "Electrical and Electronic Engineering",
	},
	{ name: "Dr. Chiamaka Obi", affiliation: "Microbiology" },
];

type ResearchSeed = {
	title: string;
	abstract: string;
	researchArea: string;
	departmentName: string;
	facultyName: string;
	monthsAgo: number;
	authors: number[]; // indices into authorPool
	publication?: {
		type: (typeof schema.publicationTypeEnum.enumValues)[number];
		journal: string;
		volume?: string;
		issue?: string;
		pages?: string;
	};
};

const researchSeeds: ResearchSeed[] = [
	{
		title:
			"Soil Micronutrient Depletion in Cassava Monoculture Systems in Southwestern Nigeria",
		abstract:
			"This study assesses zinc and boron depletion across five seasons of continuous cassava monocropping on ferralsol plots in Osun State, comparing micronutrient status against fallowed control plots and evaluating the cost-effectiveness of targeted foliar supplementation.",
		researchArea: "Agriculture",
		departmentName: "Crop Production and Protection",
		facultyName: "Faculty of Agriculture",
		monthsAgo: 22,
		authors: [0, 6],
		publication: {
			type: "journal_article",
			journal: "Nigerian Journal of Soil and Crop Science",
			volume: "18",
			issue: "2",
			pages: "134-148",
		},
	},
	{
		title:
			"A Retrospective Review of Post-Operative Wound Infection Rates at a Tertiary Hospital in Southwestern Nigeria",
		abstract:
			"A five-year retrospective chart review of surgical site infection rates following clean and clean-contaminated procedures, identifying antibiotic prophylaxis timing and ward occupancy density as the strongest associated factors.",
		researchArea: "Public Health",
		departmentName: "Community Health",
		facultyName: "College of Health Sciences",
		monthsAgo: 14,
		authors: [1, 7],
		publication: {
			type: "journal_article",
			journal: "West African Journal of Clinical Medicine",
			volume: "31",
			issue: "1",
			pages: "45-59",
		},
	},
	{
		title: "Load-Balancing Algorithms for Low-Bandwidth Rural Network Deployments",
		abstract:
			"An empirical comparison of round-robin, weighted least-connections, and adaptive latency-based load-balancing strategies for shared rural internet access points, measured under intermittent 2G/3G backhaul conditions typical of underserved communities.",
		researchArea: "Computer Science",
		departmentName: "Computer Science and Engineering",
		facultyName: "Faculty of Technology",
		monthsAgo: 9,
		authors: [2, 8],
		publication: {
			type: "conference_paper",
			journal: "Proceedings of the West African Symposium on Applied Computing",
			pages: "212-225",
		},
	},
	{
		title:
			"Comparative Analysis of Indigenous Language Preservation Policies in West Africa",
		abstract:
			"A comparative policy analysis of language documentation and school curriculum initiatives for endangered indigenous languages across four West African countries, drawing on interviews with ministry officials and community language custodians.",
		researchArea: "Linguistics",
		departmentName: "Linguistics and African Languages",
		facultyName: "Faculty of Arts",
		monthsAgo: 27,
		authors: [3, 9],
		publication: {
			type: "journal_article",
			journal: "Journal of West African Languages",
			volume: "52",
			issue: "1",
			pages: "1-24",
		},
	},
	{
		title:
			"Voltage Stability Assessment of Distribution Feeders Under Intermittent Solar Generation",
		abstract:
			"Load-flow simulations of a representative 11kV distribution feeder incorporating rooftop solar penetration, quantifying voltage rise and reverse power flow risks and proposing tap-changer settings to keep voltage within statutory limits.",
		researchArea: "Electrical Engineering",
		departmentName: "Electrical and Electronic Engineering",
		facultyName: "Faculty of Technology",
		monthsAgo: 17,
		authors: [4, 10],
		publication: {
			type: "journal_article",
			journal: "Nigerian Journal of Electrical and Power Systems",
			volume: "9",
			issue: "3",
			pages: "301-316",
		},
	},
	{
		title:
			"Antibiotic Resistance Patterns of Escherichia coli Isolates from Well Water Sources in Ile-Ife",
		abstract:
			"Susceptibility testing of E. coli isolates recovered from forty hand-dug wells found high resistance to ampicillin and co-trimoxazole, with resistance prevalence correlated to well proximity to on-site sanitation facilities.",
		researchArea: "Microbiology",
		departmentName: "Microbiology",
		facultyName: "Faculty of Science",
		monthsAgo: 6,
		authors: [5, 11],
		publication: {
			type: "journal_article",
			journal: "African Journal of Microbiology and Public Health",
			volume: "14",
			issue: "2",
			pages: "88-101",
		},
	},
	{
		title:
			"Yield Response of Maize-Cowpea Intercropping Systems to Reduced Tillage Practices",
		abstract:
			"A two-season field trial comparing conventional tillage against reduced and zero-tillage maize-cowpea intercrops, reporting yield, soil moisture retention, and labour-hour differences relevant to smallholder adoption decisions.",
		researchArea: "Agriculture",
		departmentName: "Crop Production and Protection",
		facultyName: "Faculty of Agriculture",
		monthsAgo: 4,
		authors: [0, 6],
	},
	{
		title: "Maternal Health-Seeking Behaviour in Peri-Urban Communities of Osun State",
		abstract:
			"A mixed-methods study of antenatal and delivery care choices among women in three peri-urban settlements, identifying transport cost and perceived provider attitude as the leading deterrents to facility-based delivery.",
		researchArea: "Public Health",
		departmentName: "Community Health",
		facultyName: "College of Health Sciences",
		monthsAgo: 11,
		authors: [1, 7],
		publication: {
			type: "journal_article",
			journal: "West African Journal of Clinical Medicine",
			volume: "30",
			issue: "4",
			pages: "410-423",
		},
	},
	{
		title:
			"Offline-First Data Synchronization Strategies for Primary Healthcare Record Systems",
		abstract:
			"A design study of conflict-resolution strategies for offline-first electronic health record apps used at primary healthcare centres with unreliable connectivity, benchmarking sync latency and data-loss rates across three approaches.",
		researchArea: "Computer Science",
		departmentName: "Computer Science and Engineering",
		facultyName: "Faculty of Technology",
		monthsAgo: 3,
		authors: [2, 8],
		publication: {
			type: "conference_paper",
			journal: "Proceedings of the West African Symposium on Applied Computing",
			pages: "77-90",
		},
	},
	{
		title:
			"Lexical Borrowing Patterns Between Yoruba and English in Contemporary Print Media",
		abstract:
			"A corpus-based study of loanwords and code-mixing in Yoruba-language newspapers published between 2015 and 2024, tracking shifts in borrowing frequency across political, entertainment, and business sections.",
		researchArea: "Linguistics",
		departmentName: "Linguistics and African Languages",
		facultyName: "Faculty of Arts",
		monthsAgo: 19,
		authors: [3, 9],
	},
	{
		title:
			"Fault Detection in Low-Voltage Distribution Networks Using Harmonic Signature Analysis",
		abstract:
			"A method for identifying incipient cable joint faults on low-voltage feeders by analysing harmonic distortion signatures captured at substation level, validated against field fault records from a distribution utility.",
		researchArea: "Electrical Engineering",
		departmentName: "Electrical and Electronic Engineering",
		facultyName: "Faculty of Technology",
		monthsAgo: 8,
		authors: [4, 10],
		publication: {
			type: "conference_paper",
			journal: "Proceedings of the Nigerian Power and Energy Conference",
			pages: "150-162",
		},
	},
	{
		title:
			"Prevalence of Aflatoxin-Producing Fungi in Stored Groundnut Across Three Local Government Areas",
		abstract:
			"A survey of Aspergillus contamination in farm-stored groundnut samples, relating fungal prevalence and aflatoxin B1 concentration to storage duration and warehouse humidity conditions across three local government areas.",
		researchArea: "Microbiology",
		departmentName: "Microbiology",
		facultyName: "Faculty of Science",
		monthsAgo: 13,
		authors: [5, 11],
		publication: {
			type: "journal_article",
			journal: "African Journal of Microbiology and Public Health",
			volume: "13",
			issue: "3",
			pages: "205-219",
		},
	},
];

type InnovationSeed = {
	title: string;
	summary: string;
	departmentName: string;
	facultyName: string;
	status: (typeof schema.innovationStatusEnum.enumValues)[number];
	trl: number;
	industryApplications: string[];
	monthsAgo: number;
};

const innovationSeeds: InnovationSeed[] = [
	{
		title: "Low-Cost Soil Moisture Sensor Network for Smallholder Irrigation Scheduling",
		summary:
			"A network of low-cost capacitive soil moisture sensors reporting over a low-power radio link, giving smallholder farmers irrigation timing guidance without a subscription data plan.",
		departmentName: "Crop Production and Protection",
		facultyName: "Faculty of Agriculture",
		status: "published",
		trl: 6,
		industryApplications: ["Smallholder irrigation", "Agricultural extension services"],
		monthsAgo: 10,
	},
	{
		title: "Offline Clinical Triage Support Tool for Rural Primary Health Centres",
		summary:
			"A tablet-based triage checklist and referral guide that runs entirely offline, built for community health extension workers at primary health centres with unreliable connectivity.",
		departmentName: "Community Health",
		facultyName: "College of Health Sciences",
		status: "published",
		trl: 5,
		industryApplications: ["Primary healthcare", "Community health worker tools"],
		monthsAgo: 7,
	},
	{
		title: "Solar-Assisted Cassava Drying Rack for Small-Scale Processors",
		summary:
			"A raised drying rack with a passive solar collector and reversible airflow vents, reducing cassava chip drying time and mould spoilage compared to open-ground drying.",
		departmentName: "Crop Production and Protection",
		facultyName: "Faculty of Agriculture",
		status: "published",
		trl: 7,
		industryApplications: ["Cassava processing", "Post-harvest handling"],
		monthsAgo: 16,
	},
	{
		title: "Low-Bandwidth Mesh Networking Kit for Underserved Campus Areas",
		summary:
			"A self-configuring mesh network kit built from commodity routers and open firmware, extending basic internet access to hostel blocks and reading areas outside existing campus wiring.",
		departmentName: "Computer Science and Engineering",
		facultyName: "Faculty of Technology",
		status: "published",
		trl: 6,
		industryApplications: ["Campus connectivity", "Community networking"],
		monthsAgo: 5,
	},
	{
		title: "Biodegradable Packaging Film from Cassava Peel Starch",
		summary:
			"A biodegradable film formulation extracted from cassava peel waste starch, evaluated for tensile strength and moisture resistance as an alternative to single-use plastic wrap for produce packaging.",
		departmentName: "Crop Production and Protection",
		facultyName: "Faculty of Agriculture",
		status: "under_review",
		trl: 3,
		industryApplications: ["Food packaging", "Agro-waste valorisation"],
		monthsAgo: 2,
	},
	{
		title: "Portable Water Turbidity Testing Device for Rural Water Schemes",
		summary:
			"A battery-powered handheld turbidity meter with a simplified three-tier readout, designed for community water scheme operators to screen source water without laboratory access.",
		departmentName: "Microbiology",
		facultyName: "Faculty of Science",
		status: "published",
		trl: 5,
		industryApplications: ["Rural water supply monitoring", "Public health screening"],
		monthsAgo: 12,
	},
	{
		title: "Yoruba Text-to-Speech Engine for Low-Literacy Health Communication",
		summary:
			"A prototype text-to-speech engine trained on recorded Yoruba speech, intended to deliver health advisories through community radio and mobile handsets to low-literacy audiences.",
		departmentName: "Linguistics and African Languages",
		facultyName: "Faculty of Arts",
		status: "draft",
		trl: 2,
		industryApplications: ["Public health communication", "Assistive language technology"],
		monthsAgo: 1,
	},
	{
		title: "Automated Irrigation Controller for Smallholder Vegetable Farms",
		summary:
			"A timer-and-sensor irrigation controller that schedules drip irrigation cycles for small vegetable plots based on soil moisture thresholds rather than fixed clock times.",
		departmentName: "Electrical and Electronic Engineering",
		facultyName: "Faculty of Technology",
		status: "approved",
		trl: 4,
		industryApplications: ["Smallholder irrigation", "Vegetable farming"],
		monthsAgo: 3,
	},
	{
		title: "Compact Biogas Digester for Poultry Farm Waste Management",
		summary:
			"A modular fixed-dome biogas digester sized for small and medium poultry farms, converting manure into cooking-grade biogas and reducing on-site waste accumulation.",
		departmentName: "Crop Production and Protection",
		facultyName: "Faculty of Agriculture",
		status: "published",
		trl: 6,
		industryApplications: ["Poultry farm waste management", "Renewable energy for agriculture"],
		monthsAgo: 20,
	},
	{
		title: "Low-Voltage Fault Indicator for Rural Distribution Feeders",
		summary:
			"A clamp-mounted fault-passage indicator for rural low-voltage feeders, giving line crews a visible signal of fault location without needing to de-energise the whole feeder to test.",
		departmentName: "Electrical and Electronic Engineering",
		facultyName: "Faculty of Technology",
		status: "archived",
		trl: 4,
		industryApplications: ["Rural electrification", "Distribution utility maintenance"],
		monthsAgo: 24,
	},
];

type PatentSeed = {
	title: string;
	abstract: string;
	status: (typeof schema.patentStatusEnum.enumValues)[number];
	jurisdiction: string;
	monthsAgo: number;
	granted?: boolean;
	innovationIndex: number | null; // index into innovationSeeds, or null for a standalone patent
};

const patentSeeds: PatentSeed[] = [
	{
		title: "Low-Cost Capacitive Soil Moisture Sensor Assembly and Reporting Method",
		abstract:
			"A method and assembly for a capacitive soil moisture sensor with a low-power periodic reporting scheme suited to unattended field deployment.",
		status: "filed",
		jurisdiction: "Nigeria",
		monthsAgo: 8,
		innovationIndex: 0,
	},
	{
		title: "Passive Solar-Assisted Drying Rack with Reversible Airflow Vents",
		abstract:
			"A drying rack apparatus combining a passive solar collector with manually reversible airflow vents to regulate drying rate for root-crop chips.",
		status: "pending",
		jurisdiction: "Nigeria",
		monthsAgo: 14,
		innovationIndex: 2,
	},
	{
		title: "Fixed-Dome Biogas Digester Configuration for Small Livestock Operations",
		abstract:
			"A fixed-dome biogas digester configuration sized and baffled for intermittent, low-volume manure loading typical of small and medium poultry operations.",
		status: "granted",
		jurisdiction: "Nigeria",
		monthsAgo: 18,
		granted: true,
		innovationIndex: 8,
	},
	{
		title: "Handheld Turbidity Screening Device with Tiered Visual Readout",
		abstract:
			"A handheld water turbidity screening device presenting a simplified tiered visual readout for use by non-laboratory personnel.",
		status: "filed",
		jurisdiction: "Nigeria",
		monthsAgo: 10,
		innovationIndex: 5,
	},
	{
		title: "Self-Configuring Mesh Network Node for Intermittent Connectivity Areas",
		abstract:
			"A mesh network node configuration that auto-negotiates routing paths among commodity access points to extend coverage into areas without fixed wiring.",
		status: "idea_disclosure",
		jurisdiction: "Nigeria",
		monthsAgo: 3,
		innovationIndex: 3,
	},
	{
		title: "Offline Clinical Triage Decision Support Interface and Sync Method",
		abstract:
			"An offline-first clinical triage decision support interface with a deferred synchronization method for intermittently connected primary care settings.",
		status: "licensed",
		jurisdiction: "Nigeria",
		monthsAgo: 6,
		granted: true,
		innovationIndex: 1,
	},
	{
		title: "Antimicrobial Coating Formulation for Reusable Medical Device Surfaces",
		abstract:
			"A silver-ion-based antimicrobial coating formulation and application method for high-touch reusable medical device surfaces in resource-limited clinical settings.",
		status: "idea_disclosure",
		jurisdiction: "Nigeria",
		monthsAgo: 2,
		innovationIndex: null,
	},
	{
		title: "Soil-Moisture-Triggered Drip Irrigation Scheduling Controller",
		abstract:
			"An irrigation controller that schedules drip cycles from soil moisture threshold readings rather than a fixed clock, for small vegetable plot deployment.",
		status: "pending",
		jurisdiction: "Nigeria",
		monthsAgo: 2,
		innovationIndex: 7,
	},
];

async function main() {
	const [{ count: existingSeedRows }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.researchRecords)
		.where(sql`${schema.researchRecords.metadata}->>'seedBatch' = ${SEED_BATCH_ID}`);

	if (Number(existingSeedRows) > 0) {
		process.stdout.write(
			`Seed batch "${SEED_BATCH_ID}" already present (${existingSeedRows} research record(s)) — skipping. ` +
				"Bump SEED_BATCH_ID in this script if you intentionally want a second batch.\n",
		);
		return;
	}

	await db.transaction(async (tx) => {
		// --- Faculties & departments -------------------------------------
		for (const faculty of facultiesToEnsure) {
			await tx
				.insert(schema.faculties)
				.values({
					name: faculty.name,
					slug: faculty.slug,
					code: faculty.code,
					description: `${faculty.name} at Obafemi Awolowo University.`,
				})
				.onConflictDoNothing({ target: schema.faculties.slug });
		}

		const facultyRows = await tx.select().from(schema.faculties);
		const facultyIdByName = new Map(facultyRows.map((row) => [row.name, row.id]));

		for (const department of departmentsToEnsure) {
			const facultyId = facultyIdByName.get(department.facultyName);
			if (!facultyId) {
				throw new Error(`Faculty not found for department seed: ${department.name}`);
			}
			await tx
				.insert(schema.departments)
				.values({
					facultyId,
					name: department.name,
					slug: department.slug,
					code: department.code,
					description: `${department.name} department at Obafemi Awolowo University.`,
				})
				.onConflictDoNothing({ target: schema.departments.slug });
		}

		const departmentRows = await tx.select().from(schema.departments);
		const departmentIdByName = new Map(
			departmentRows.map((row) => [row.name, row.id]),
		);

		function requireDepartmentId(name: string): string {
			const id = departmentIdByName.get(name);
			if (!id) throw new Error(`Department not found: ${name}`);
			return id;
		}
		function requireFacultyId(name: string): string {
			const id = facultyIdByName.get(name);
			if (!id) throw new Error(`Faculty not found: ${name}`);
			return id;
		}

		// --- Authors -------------------------------------------------------
		const insertedAuthors = await tx
			.insert(schema.authors)
			.values(
				authorPool.map((author) => ({
					name: author.name,
					affiliation: author.affiliation,
				})),
			)
			.returning({ id: schema.authors.id });

		// --- Research records, authors, publications ------------------------
		let researchInserted = 0;
		let publicationsInserted = 0;

		for (const seed of researchSeeds) {
			const [record] = await tx
				.insert(schema.researchRecords)
				.values({
					title: seed.title,
					slug: slugify(seed.title),
					abstract: seed.abstract,
					status: "published",
					accessLevel: "public",
					facultyId: requireFacultyId(seed.facultyName),
					departmentId: requireDepartmentId(seed.departmentName),
					researchArea: seed.researchArea,
					startedOn: dateMonthsAgo(seed.monthsAgo + 6),
					completedOn: dateMonthsAgo(seed.monthsAgo + 1),
					publishedAt: timestampMonthsAgo(seed.monthsAgo),
					metadata: { seedBatch: SEED_BATCH_ID },
				})
				.returning({ id: schema.researchRecords.id });

			if (!record) continue;
			researchInserted += 1;

			for (const [position, authorIndex] of seed.authors.entries()) {
				const author = insertedAuthors[authorIndex];
				if (!author) continue;
				await tx.insert(schema.researchAuthors).values({
					researchRecordId: record.id,
					authorId: author.id,
					position,
					isCorresponding: position === 0,
				});
			}

			if (seed.publication) {
				await tx.insert(schema.publications).values({
					researchRecordId: record.id,
					title: seed.title,
					type: seed.publication.type,
					journal: seed.publication.journal,
					volume: seed.publication.volume,
					issue: seed.publication.issue,
					pages: seed.publication.pages,
					doi: `10.5555/oau-irr.${dateMonthsAgo(seed.monthsAgo).slice(0, 4)}.${randomToken(6)}`,
					publishedOn: dateMonthsAgo(seed.monthsAgo),
					citation: `${seed.authors
						.map((index) => authorPool[index]?.name)
						.filter(Boolean)
						.join(", ")}. "${seed.title}." ${seed.publication.journal}${
						seed.publication.volume ? `, vol. ${seed.publication.volume}` : ""
					}${seed.publication.issue ? `, no. ${seed.publication.issue}` : ""} (${dateMonthsAgo(
						seed.monthsAgo,
					).slice(0, 4)}).`,
				});
				publicationsInserted += 1;
			}
		}

		// --- Innovations -----------------------------------------------------
		const innovationIds: Array<string | null> = [];
		let innovationsInserted = 0;

		for (const seed of innovationSeeds) {
			const [innovation] = await tx
				.insert(schema.innovations)
				.values({
					title: seed.title,
					slug: slugify(seed.title),
					summary: seed.summary,
					status: seed.status,
					facultyId: requireFacultyId(seed.facultyName),
					departmentId: requireDepartmentId(seed.departmentName),
					technologyReadinessLevel: seed.trl,
					industryApplications: seed.industryApplications,
					publishedAt:
						seed.status === "published" ? timestampMonthsAgo(seed.monthsAgo) : null,
					metadata: { seedBatch: SEED_BATCH_ID },
				})
				.returning({ id: schema.innovations.id });

			innovationIds.push(innovation?.id ?? null);
			if (innovation) innovationsInserted += 1;
		}

		// --- Patents -----------------------------------------------------------
		let patentsInserted = 0;

		for (const seed of patentSeeds) {
			const innovationId =
				seed.innovationIndex === null ? null : innovationIds[seed.innovationIndex];
			const year = dateMonthsAgo(seed.monthsAgo).slice(0, 4);

			await tx.insert(schema.patents).values({
				innovationId: innovationId ?? null,
				title: seed.title,
				applicationNumber: `NG/PT/${year}/${randomToken(5)}`,
				patentNumber: seed.granted ? `NG${randomToken(6)}` : null,
				jurisdiction: seed.jurisdiction,
				status: seed.status,
				filedOn: dateMonthsAgo(seed.monthsAgo),
				grantedOn: seed.granted ? dateMonthsAgo(Math.max(seed.monthsAgo - 4, 0)) : null,
				abstract: seed.abstract,
				metadata: { seedBatch: SEED_BATCH_ID },
			});
			patentsInserted += 1;
		}

		process.stdout.write(
			[
				"Seed complete.",
				`Faculties ensured: ${facultiesToEnsure.length} (existing ones reused).`,
				`Departments ensured: ${departmentsToEnsure.length} (existing ones reused).`,
				`Authors inserted: ${insertedAuthors.length}.`,
				`Research records inserted: ${researchInserted}.`,
				`Publications inserted: ${publicationsInserted}.`,
				`Innovations inserted: ${innovationsInserted} (published: ${
					innovationSeeds.filter((seed) => seed.status === "published").length
				}).`,
				`Patents inserted: ${patentsInserted}.`,
			].join("\n") + "\n",
		);
	});
}

try {
	await main();
} catch (error) {
	const message = error instanceof Error ? error.message : "Seeding failed.";
	process.stderr.write(`Demo content seeding failed: ${message}\n`);
	process.exitCode = 1;
} finally {
	await pool.end();
}
