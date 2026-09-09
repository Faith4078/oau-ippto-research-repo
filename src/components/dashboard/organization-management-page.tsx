"use client";

import {
	Building2,
	ChevronDown,
	Edit2,
	Plus,
	RefreshCw,
	Search,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";

type OrganizationScope = "faculty" | "super";
type OrganizationResource = "all" | "departments" | "faculties";

type FacultyRecord = {
	code: string | null;
	departmentCount: number;
	description: string | null;
	id: string;
	name: string;
};

type DepartmentRecord = {
	code: string | null;
	description: string | null;
	facultyId: string;
	facultyName: string;
	id: string;
	name: string;
};

type UnitFormState = {
	code: string;
	description: string;
	name: string;
};

type DepartmentFormState = UnitFormState & {
	facultyId: string;
};

const emptyUnitForm: UnitFormState = {
	code: "",
	description: "",
	name: "",
};

const emptyDepartmentForm: DepartmentFormState = {
	...emptyUnitForm,
	facultyId: "",
};

export function OrganizationManagementPage({
	resource = "all",
	scope,
}: {
	resource?: OrganizationResource;
	scope: OrganizationScope;
}) {
	const [departmentFilter, setDepartmentFilter] = useState("");
	const [departmentForm, setDepartmentForm] =
		useState<DepartmentFormState>(emptyDepartmentForm);
	const [departmentFacultyFilter, setDepartmentFacultyFilter] = useState("");
	const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
	const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(
		null,
	);
	const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
	const [faculties, setFaculties] = useState<FacultyRecord[]>([]);
	const [facultyFilter, setFacultyFilter] = useState("");
	const [facultyForm, setFacultyForm] = useState<UnitFormState>(emptyUnitForm);
	const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
	const [isFacultyFormOpen, setIsFacultyFormOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [savingDepartment, setSavingDepartment] = useState(false);
	const [savingFaculty, setSavingFaculty] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [facultyResponse, departmentResponse] = await Promise.all([
				fetch("/api/admin/organization/faculties", { cache: "no-store" }),
				fetch("/api/admin/organization/departments", { cache: "no-store" }),
			]);
			const [facultyPayload, departmentPayload] = await Promise.all([
				facultyResponse.json(),
				departmentResponse.json(),
			]);
			if (!facultyResponse.ok) {
				throw new Error(
					facultyPayload.error?.message ?? "Faculties could not be loaded.",
				);
			}
			if (!departmentResponse.ok) {
				throw new Error(
					departmentPayload.error?.message ??
						"Departments could not be loaded.",
				);
			}

			setFaculties(facultyPayload.data ?? []);
			setDepartments(departmentPayload.data ?? []);
		} catch (error) {
			toast.error("Organization records unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const visibleFaculties = useMemo(
		() => faculties.filter((faculty) => matchesUnit(faculty, facultyFilter)),
		[faculties, facultyFilter],
	);

	const visibleDepartments = useMemo(
		() =>
			departments.filter(
				(department) =>
					matchesUnit(department, departmentFilter) &&
					(!departmentFacultyFilter ||
						department.facultyId === departmentFacultyFilter),
			),
		[departmentFacultyFilter, departmentFilter, departments],
	);

	async function saveFaculty(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSavingFaculty(true);
		try {
			const response = await fetch("/api/admin/organization/faculties", {
				body: JSON.stringify({
					...formPayload(facultyForm),
					...(editingFacultyId ? { id: editingFacultyId } : {}),
				}),
				headers: { "content-type": "application/json" },
				method: editingFacultyId ? "PATCH" : "POST",
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? "Faculty could not be saved.",
				);
			}

			toast.success(editingFacultyId ? "Faculty updated" : "Faculty created");
			resetFacultyForm();
			await load();
		} catch (error) {
			toast.error("Faculty not saved", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setSavingFaculty(false);
		}
	}

	async function saveDepartment(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSavingDepartment(true);
		try {
			const response = await fetch("/api/admin/organization/departments", {
				body: JSON.stringify({
					...formPayload(departmentForm),
					facultyId:
						scope === "super" || departmentForm.facultyId
							? departmentForm.facultyId || null
							: null,
					...(editingDepartmentId ? { id: editingDepartmentId } : {}),
				}),
				headers: { "content-type": "application/json" },
				method: editingDepartmentId ? "PATCH" : "POST",
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? "Department could not be saved.",
				);
			}

			toast.success(
				editingDepartmentId ? "Department updated" : "Department created",
			);
			resetDepartmentForm();
			await load();
		} catch (error) {
			toast.error("Department not saved", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setSavingDepartment(false);
		}
	}

	function editDepartment(department: DepartmentRecord) {
		setEditingDepartmentId(department.id);
		setIsDepartmentFormOpen(true);
		setDepartmentForm({
			code: department.code ?? "",
			description: department.description ?? "",
			facultyId: department.facultyId,
			name: department.name,
		});
	}

	function editFaculty(faculty: FacultyRecord) {
		setEditingFacultyId(faculty.id);
		setIsFacultyFormOpen(true);
		setFacultyForm({
			code: faculty.code ?? "",
			description: faculty.description ?? "",
			name: faculty.name,
		});
	}

	function resetDepartmentForm() {
		setEditingDepartmentId(null);
		setIsDepartmentFormOpen(false);
		setDepartmentForm(emptyDepartmentForm);
	}

	function resetFacultyForm() {
		setEditingFacultyId(null);
		setIsFacultyFormOpen(false);
		setFacultyForm(emptyUnitForm);
	}

	const showDepartments = resource !== "faculties";
	const showFaculties = scope === "super" && resource !== "departments";
	const pageCopy = organizationPageCopy(scope, resource);
	const formGridClass =
		showDepartments && showFaculties
			? "grid gap-6 xl:grid-cols-2"
			: "grid gap-6";

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-sm font-semibold text-[#146ef5]">
						Organization management
					</p>
					<h1 className="mt-2 text-4xl font-semibold tracking-normal">
						{pageCopy.title}
					</h1>
					<p className="mt-3 max-w-3xl text-[#6b7280]">
						{pageCopy.description}
					</p>
				</div>
				<Button onClick={() => void load()} size="sm" variant="outline">
					<RefreshCw className="h-4 w-4" />
					Refresh
				</Button>
			</header>

			{showFaculties ? (
				<FacultiesList
					faculties={visibleFaculties}
					filter={facultyFilter}
					loading={loading}
					onEdit={editFaculty}
					onFilterChange={setFacultyFilter}
				/>
			) : null}
			{showDepartments ? (
				<DepartmentsList
					departmentFacultyFilter={departmentFacultyFilter}
					departments={visibleDepartments}
					faculties={faculties}
					filter={departmentFilter}
					loading={loading}
					onEdit={editDepartment}
					onFacultyFilterChange={setDepartmentFacultyFilter}
					onFilterChange={setDepartmentFilter}
					scope={scope}
				/>
			) : null}

			<div className={formGridClass}>
				{showFaculties ? (
					<UnitFormCard
						editing={Boolean(editingFacultyId)}
						form={facultyForm}
						onCancel={resetFacultyForm}
						onChange={setFacultyForm}
						onOpen={() => setIsFacultyFormOpen(true)}
						onSubmit={saveFaculty}
						open={isFacultyFormOpen}
						saving={savingFaculty}
						submitLabel="Save faculty"
						title="Faculty details"
					/>
				) : null}
				{showDepartments ? (
					<DepartmentFormCard
						editing={Boolean(editingDepartmentId)}
						faculties={faculties}
						form={departmentForm}
						onCancel={resetDepartmentForm}
						onChange={setDepartmentForm}
						onOpen={() => setIsDepartmentFormOpen(true)}
						onSubmit={saveDepartment}
						open={isDepartmentFormOpen}
						saving={savingDepartment}
						scope={scope}
					/>
				) : null}
			</div>
		</div>
	);
}

function organizationPageCopy(
	scope: OrganizationScope,
	resource: OrganizationResource,
) {
	if (resource === "faculties") {
		return {
			description:
				"List, filter, create, view, and edit the faculties used across sign-up, reviews, and reporting.",
			title: "Faculties",
		};
	}

	if (resource === "departments") {
		return {
			description:
				scope === "super"
					? "List, filter, create, view, and edit departments across every faculty."
					: "List, filter, create, view, and edit departments inside your assigned faculty.",
			title: scope === "super" ? "Departments" : "Faculty departments",
		};
	}

	return {
		description:
			"Create, filter, and update the university organization records used by sign-up, reviews, and reports.",
		title: "Faculties and departments",
	};
}

function DepartmentFormCard({
	editing,
	faculties,
	form,
	onCancel,
	onChange,
	onOpen,
	onSubmit,
	open,
	saving,
	scope,
}: {
	editing: boolean;
	faculties: FacultyRecord[];
	form: DepartmentFormState;
	onCancel: () => void;
	onChange: (form: DepartmentFormState) => void;
	onOpen: () => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	open: boolean;
	saving: boolean;
	scope: OrganizationScope;
}) {
	if (!open) {
		return (
			<Card>
				<CardHeader className="flex-row items-start justify-between gap-4">
					<div>
						<CardTitle>Add department</CardTitle>
						<CardDescription>
							Open this form when you need to create a department.
						</CardDescription>
					</div>
					<Button onClick={onOpen} type="button" variant="outline">
						<Plus className="h-4 w-4" />
						New department
						<ChevronDown className="h-4 w-4" />
					</Button>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{editing ? "Edit department" : "Add department"}</CardTitle>
				<CardDescription>
					{scope === "super"
						? "Place each department under the faculty that owns its review scope."
						: "New departments are attached to your faculty automatically."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4" onSubmit={onSubmit}>
					{scope === "super" ? (
						<label className="grid gap-2 text-sm font-semibold">
							Faculty
							<select
								className="h-11 rounded border border-[#d8d8d8] bg-white px-3"
								onChange={(event) =>
									onChange({ ...form, facultyId: event.target.value })
								}
								required
								value={form.facultyId}
							>
								<option value="">Choose faculty</option>
								{faculties.map((faculty) => (
									<option key={faculty.id} value={faculty.id}>
										{faculty.name}
									</option>
								))}
							</select>
						</label>
					) : null}
					<UnitFields
						form={form}
						idPrefix="department-form"
						onChange={onChange}
					/>
					<FormActions
						cancelLabel="Clear department form"
						disabled={
							!form.name.trim() || (scope === "super" && !form.facultyId)
						}
						editing={editing}
						onCancel={onCancel}
						saving={saving}
						submitLabel="Save department"
					/>
				</form>
			</CardContent>
		</Card>
	);
}

function DepartmentsList({
	departmentFacultyFilter,
	departments,
	faculties,
	filter,
	loading,
	onEdit,
	onFacultyFilterChange,
	onFilterChange,
	scope,
}: {
	departmentFacultyFilter: string;
	departments: DepartmentRecord[];
	faculties: FacultyRecord[];
	filter: string;
	loading: boolean;
	onEdit: (department: DepartmentRecord) => void;
	onFacultyFilterChange: (value: string) => void;
	onFilterChange: (value: string) => void;
	scope: OrganizationScope;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<CardTitle>Departments</CardTitle>
						<CardDescription>
							Filter departments by name, code, or faculty before editing.
						</CardDescription>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[#6b7280]" />
							<Input
								aria-label="Filter departments"
								className="pl-9"
								onChange={(event) => onFilterChange(event.target.value)}
								placeholder="Filter departments"
								value={filter}
							/>
						</div>
						{scope === "super" ? (
							<select
								className="h-9 rounded border border-[#d8d8d8] bg-white px-3 text-sm"
								onChange={(event) => onFacultyFilterChange(event.target.value)}
								value={departmentFacultyFilter}
							>
								<option value="">All faculties</option>
								{faculties.map((faculty) => (
									<option key={faculty.id} value={faculty.id}>
										{faculty.name}
									</option>
								))}
							</select>
						) : null}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<LoadingSkeleton label="Loading departments" rows={3} />
				) : departments.length === 0 ? (
					<EmptyState label="No departments match those filters." />
				) : (
					<div className="divide-y divide-[#e5e7eb]">
						{departments.map((department) => (
							<div
								className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
								key={department.id}
							>
								<div>
									<p className="font-medium">{department.name}</p>
									<p className="text-sm text-[#6b7280]">
										{department.code ? `${department.code} · ` : ""}
										{department.facultyName}
									</p>
									{department.description ? (
										<p className="mt-1 max-w-3xl text-sm text-[#6b7280]">
											{department.description}
										</p>
									) : null}
								</div>
								<Button
									onClick={() => onEdit(department)}
									size="sm"
									variant="outline"
								>
									<Edit2 className="h-4 w-4" />
									Edit
								</Button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function EmptyState({ label }: { label: string }) {
	return (
		<p className="rounded-lg border border-dashed border-[#d8d8d8] p-6 text-center text-sm font-medium text-[#6b7280]">
			{label}
		</p>
	);
}

function FacultiesList({
	faculties,
	filter,
	loading,
	onEdit,
	onFilterChange,
}: {
	faculties: FacultyRecord[];
	filter: string;
	loading: boolean;
	onEdit: (faculty: FacultyRecord) => void;
	onFilterChange: (value: string) => void;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle>Faculties</CardTitle>
						<CardDescription>
							Filter faculties before editing their public names and codes.
						</CardDescription>
					</div>
					<div className="relative w-full sm:max-w-xs">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[#6b7280]" />
						<Input
							aria-label="Filter faculties"
							className="pl-9"
							onChange={(event) => onFilterChange(event.target.value)}
							placeholder="Filter faculties"
							value={filter}
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<LoadingSkeleton label="Loading faculties" rows={3} />
				) : faculties.length === 0 ? (
					<EmptyState label="No faculties match those filters." />
				) : (
					<div className="divide-y divide-[#e5e7eb]">
						{faculties.map((faculty) => (
							<div
								className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
								key={faculty.id}
							>
								<div>
									<p className="font-medium">{faculty.name}</p>
									<p className="text-sm text-[#6b7280]">
										{faculty.code ? `${faculty.code} · ` : ""}
										{faculty.departmentCount} departments
									</p>
									{faculty.description ? (
										<p className="mt-1 max-w-3xl text-sm text-[#6b7280]">
											{faculty.description}
										</p>
									) : null}
								</div>
								<Button
									onClick={() => onEdit(faculty)}
									size="sm"
									variant="outline"
								>
									<Edit2 className="h-4 w-4" />
									Edit
								</Button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function FormActions({
	cancelLabel,
	disabled,
	editing,
	onCancel,
	saving,
	submitLabel,
}: {
	cancelLabel: string;
	disabled: boolean;
	editing: boolean;
	onCancel: () => void;
	saving: boolean;
	submitLabel: string;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button disabled={disabled || saving} type="submit">
				<Building2 className="h-4 w-4" />
				{saving ? "Saving…" : submitLabel}
			</Button>
			{editing ? (
				<Button onClick={onCancel} type="button" variant="outline">
					<XCircle className="h-4 w-4" />
					{cancelLabel}
				</Button>
			) : null}
		</div>
	);
}

function UnitFields<TForm extends UnitFormState>({
	form,
	idPrefix,
	onChange,
}: {
	form: TForm;
	idPrefix: string;
	onChange: (form: TForm) => void;
}) {
	return (
		<>
			<label
				className="grid gap-2 text-sm font-semibold"
				htmlFor={`${idPrefix}-name`}
			>
				Name
				<Input
					id={`${idPrefix}-name`}
					onChange={(event) => onChange({ ...form, name: event.target.value })}
					placeholder="e.g. Faculty of Technology"
					required
					value={form.name}
				/>
			</label>
			<label
				className="grid gap-2 text-sm font-semibold"
				htmlFor={`${idPrefix}-code`}
			>
				Code
				<Input
					id={`${idPrefix}-code`}
					onChange={(event) => onChange({ ...form, code: event.target.value })}
					placeholder="Optional short code"
					value={form.code}
				/>
			</label>
			<label
				className="grid gap-2 text-sm font-semibold"
				htmlFor={`${idPrefix}-description`}
			>
				Description
				<textarea
					className="min-h-24 rounded border border-[#d8d8d8] bg-white px-3 py-2 text-sm"
					id={`${idPrefix}-description`}
					onChange={(event) =>
						onChange({ ...form, description: event.target.value })
					}
					placeholder="Optional context for administrators"
					value={form.description}
				/>
			</label>
		</>
	);
}

function UnitFormCard({
	editing,
	form,
	onCancel,
	onChange,
	onOpen,
	onSubmit,
	open,
	saving,
	submitLabel,
	title,
}: {
	editing: boolean;
	form: UnitFormState;
	onCancel: () => void;
	onChange: (form: UnitFormState) => void;
	onOpen: () => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	open: boolean;
	saving: boolean;
	submitLabel: string;
	title: string;
}) {
	if (!open) {
		return (
			<Card>
				<CardHeader className="flex-row items-start justify-between gap-4">
					<div>
						<CardTitle>Add faculty</CardTitle>
						<CardDescription>
							Open this form when you need to create a faculty.
						</CardDescription>
					</div>
					<Button onClick={onOpen} type="button" variant="outline">
						<Plus className="h-4 w-4" />
						New faculty
						<ChevronDown className="h-4 w-4" />
					</Button>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{editing ? "Edit faculty" : title}</CardTitle>
				<CardDescription>
					Keep faculty names and codes aligned with university structure.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4" onSubmit={onSubmit}>
					<UnitFields form={form} idPrefix="faculty-form" onChange={onChange} />
					<FormActions
						cancelLabel="Clear faculty form"
						disabled={!form.name.trim()}
						editing={editing}
						onCancel={onCancel}
						saving={saving}
						submitLabel={submitLabel}
					/>
				</form>
			</CardContent>
		</Card>
	);
}

function formPayload(form: UnitFormState) {
	return {
		code: form.code.trim() || null,
		description: form.description.trim() || null,
		name: form.name.trim(),
	};
}

function matchesUnit(
	unit: Pick<
		DepartmentRecord | FacultyRecord,
		"code" | "description" | "name"
	> &
		Partial<Pick<DepartmentRecord, "facultyName">>,
	filter: string,
) {
	const search = filter.trim().toLowerCase();
	if (!search) return true;

	return [unit.name, unit.code, unit.description, unit.facultyName]
		.filter((value): value is string => Boolean(value))
		.some((value) => value.toLowerCase().includes(search));
}
