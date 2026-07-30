export const passwordPolicyText =
	"Use exactly 8 characters with uppercase, lowercase, a number, and a special symbol.";

export const passwordPolicyPattern =
	"(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8}";

export type PasswordRequirement = {
	id: "length" | "lowercase" | "uppercase" | "number" | "symbol";
	label: string;
	valid: boolean;
};

export function getPasswordRequirements(
	password: string,
): Array<PasswordRequirement> {
	return [
		{
			id: "length",
			label: "Exactly 8 characters",
			valid: password.length === 8,
		},
		{
			id: "uppercase",
			label: "At least one uppercase letter",
			valid: /[A-Z]/.test(password),
		},
		{
			id: "lowercase",
			label: "At least one lowercase letter",
			valid: /[a-z]/.test(password),
		},
		{
			id: "number",
			label: "At least one number",
			valid: /\d/.test(password),
		},
		{
			id: "symbol",
			label: "At least one special symbol",
			valid: /[^A-Za-z0-9]/.test(password),
		},
	];
}

export function isValidPassword(password: string) {
	return getPasswordRequirements(password).every(
		(requirement) => requirement.valid,
	);
}
