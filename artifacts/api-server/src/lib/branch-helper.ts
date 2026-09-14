import { SQL, eq, isNull, or, sql } from "drizzle-orm";
import type { Request } from "express";

/**
 * Resolves the effective branch for the request.
 * 
 * Rules:
 * 1. If staff/manager is logged in and assigned to a specific branch -> mode: "branch", branchId: X
 * 2. If staff has no branch assignment -> mode: "main", branchId: null
 * 3. For Owner/Admin:
 *    - "all" -> mode: "all", branchId: null (returns undefined condition so all records are included)
 *    - "main" | "default-main" | "default" | "0" -> mode: "main", branchId: null (filters branchId IS NULL or 0)
 *    - number > 0 -> mode: "branch", branchId: number (filters branchId = X)
 *    - unspecified -> mode: "all" (for global overviews/dashboards)
 */
export type BranchScope = {
  mode: "all" | "main" | "branch";
  branchId: number | null;
  isStaff: boolean;
};

export function getBranchScope(req: Request, body?: Record<string, any>): BranchScope {
  const session = (req as any)?.session;
  const role = String(session?.userRole ?? "").toLowerCase();
  const isStaff = Boolean(session?.staffId) || ["staff", "technician", "manager", "both"].includes(role);

  // A staff member's assignment always wins over client-provided branch values.
  if (isStaff) {
    const sId = Number(session?.branchId);
    if (Number.isInteger(sId) && sId > 0) {
      return { mode: "branch", branchId: sId, isStaff: true };
    }
    return { mode: "main", branchId: null, isStaff: true };
  }

  // Check candidate inputs in order of priority, skipping invalid or undefined strings
  const candidates = [
    req.query?.branchId,
    req.query?.branch_id,
    req.headers?.["x-branch-id"],
    body?.branchId,
    body?.branch_id,
  ];

  let rawValue = "";
  for (const c of candidates) {
    if (c !== undefined && c !== null) {
      const s = String(c).trim();
      if (s !== "" && s !== "undefined" && s !== "null" && s !== "NaN") {
        rawValue = s.toLowerCase();
        break;
      }
    }
  }

  if (rawValue === "all") {
    return { mode: "all", branchId: null, isStaff: false };
  }

  if (rawValue === "main" || rawValue === "default-main" || rawValue === "default" || rawValue === "0") {
    return { mode: "main", branchId: null, isStaff: false };
  }

  const num = Number(rawValue);
  if (Number.isInteger(num) && num > 0) {
    return { mode: "branch", branchId: num, isStaff: false };
  }

  // Default to Main Branch for standard store views if no valid branch is specified
  return { mode: "main", branchId: null, isStaff: false };
}

export function getBranchCondition(
  req: Request,
  branchIdColumn: any
): SQL | undefined {
  const scope = getBranchScope(req);
  if (scope.mode === "all") {
    return undefined;
  }
  if (scope.mode === "main") {
    return or(isNull(branchIdColumn), eq(branchIdColumn, 0));
  }
  return eq(branchIdColumn, scope.branchId!);
}

export function getRawBranchCondition(req: Request, alias: string): SQL {
  const scope = getBranchScope(req);
  if (scope.mode === "all") {
    return sql`1=1`;
  }
  if (scope.mode === "main") {
    return sql`(${sql.raw(alias)}.branch_id IS NULL OR ${sql.raw(alias)}.branch_id = 0)`;
  }
  return sql`${sql.raw(alias)}.branch_id = ${scope.branchId}`;
}

/**
 * Extracts branch details when saving a new record.
 */
export function extractBranchSaveData(
  req: Request,
  body: Record<string, any>
): { branchId: number | null; branchName: string | null } {
  const session = (req as any)?.session;
  const role = String(session?.userRole ?? "").toLowerCase();
  const isStaff = Boolean(session?.staffId) || ["staff", "technician", "manager", "both"].includes(role);

  if (isStaff) {
    const sId = Number(session?.branchId);
    if (Number.isInteger(sId) && sId > 0) {
      return {
        branchId: sId,
        branchName: session?.branchName ? String(session.branchName) : null,
      };
    }
  }

  const scope = getBranchScope(req, body);
  const rawName = body.branchName ?? body.branch_name ?? req.headers?.["x-branch-name"];
  let branchName: string | null = null;
  if (rawName) {
    try {
      branchName = decodeURIComponent(String(rawName));
    } catch {
      branchName = String(rawName);
    }
  }

  if (scope.mode === "branch" && scope.branchId !== null) {
    return { branchId: scope.branchId, branchName: branchName || `Branch #${scope.branchId}` };
  }

  if (scope.mode === "main") {
    return { branchId: null, branchName: branchName || "Main Branch" };
  }

  return { branchId: null, branchName: null };
}

