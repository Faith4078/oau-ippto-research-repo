export type EntityId = string;

export type Metadata = Record<string, unknown>;

export type Timestamped = {
	createdAt: Date;
	updatedAt: Date;
};

export type AccessLevel = "public" | "restricted" | "private";

export type ApprovalAction =
	| "submitted"
	| "approved"
	| "rejected"
	| "changes_requested"
	| "published"
	| "archived";

export type ApprovalDecision =
	| "submit"
	| "approve"
	| "reject"
	| "request_changes"
	| "publish"
	| "archive";

export type RecordStatus =
	| "draft"
	| "submitted"
	| "department_review"
	| "faculty_review"
	| "iptto_review"
	| "approved"
	| "rejected"
	| "published"
	| "archived";
