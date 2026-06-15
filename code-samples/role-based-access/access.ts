/**
 * Role-based access — illustrative, framework-agnostic helpers.
 *
 * Sanitized reconstruction of the PATTERN BlixFlex uses for authorization. In production
 * the authoritative checks are enforced in Postgres via Row-Level Security; these helpers
 * mirror that logic for the client (UX) and as a readable reference. They are NOT the
 * security boundary on their own — the database is.
 *
 * No production dependencies; no real data.
 */

export type Role = "admin" | "analyst" | "participant";

/** Sections an admin's access can be scoped to. */
export type Section =
  | "applications"
  | "onboarding"
  | "accounts"
  | "payouts"
  | "analysts"
  | "reporting"
  | "branding"
  | "permissions";

export interface SectionPermission {
  section: Section;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  roles: Role[];
  /** Only meaningful for admins; ignored for other roles. */
  adminPermissions?: SectionPermission[];
}

export type Capability = "view" | "edit" | "delete";

/** Coarse role check — mirrors the database `has_role()` helper. */
export function hasRole(user: User, role: Role): boolean {
  return user.roles.includes(role);
}

/**
 * Resolve whether a user may perform a capability on a section.
 *
 * Rules:
 *  - A full admin (no scoping list) may do anything.
 *  - A scoped admin may do only what their per-section permission allows.
 *  - Non-admins have no section access through this path (their own-record access is
 *    handled by ownership checks elsewhere / by RLS).
 */
export function canAccessSection(
  user: User,
  section: Section,
  capability: Capability,
): boolean {
  if (!hasRole(user, "admin")) {
    return false;
  }

  // A full admin has no scoping list → unrestricted across sections.
  if (!user.adminPermissions || user.adminPermissions.length === 0) {
    return true;
  }

  const perm = user.adminPermissions.find((p) => p.section === section);
  if (!perm) return false;

  switch (capability) {
    case "view":
      return perm.canView;
    case "edit":
      return perm.canEdit;
    case "delete":
      return perm.canDelete;
    default:
      return false;
  }
}

/** Whether a participant may view a record they own. */
export function canViewOwnRecord(user: User, recordOwnerId: string): boolean {
  return user.id === recordOwnerId || hasRole(user, "admin");
}

/** Whether an analyst may view a record for a cohort they're assigned to. */
export function canAnalystViewCohort(
  user: User,
  assignedCohortIds: string[],
  cohortId: string,
): boolean {
  if (hasRole(user, "admin")) return true;
  return hasRole(user, "analyst") && assignedCohortIds.includes(cohortId);
}
