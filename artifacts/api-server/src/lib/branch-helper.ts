import { SQL, eq, isNull } from "drizzle-orm";
import type { Request } from "express";

/**
 * Resolves the effective branch for the request.
 * 
 * Rules:
 * 1. If staff/manager is logged in and assigned to a specific branch -> returns eq(column, branchId)
 * 2. If the owner/admin selected a specific sub-branch -> returns eq(column, branchId)
 * 3. Main/default/legacy data is stored with a NULL branch_id and must be filtered
 *    explicitly with IS NULL. There is no implicit "all branches" scope.
 */
export type BranchScope = { branchId: number | null };

function positiveBranchId(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str || ["all", "0", "default-main", "main", "default"].includes(str.toLowerCase())) return null;
  const num = Number(str);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export function getBranchScope(req: Request, body?: Record<string, any>): BranchScope {
  const session = req.session as any;
  const role = String(session?.userRole ?? "").toLowerCase();
  const isStaff = ["staff", "technician", "manager"].includes(role);

  // A staff member's assignment always wins over client-provided branch values.
  if (isStaff) {
    return { branchId: positiveBranchId(session?.branchId) };
  }

  const rawQueryBranch = req.query?.branchId ?? req.query?.branch_id ?? req.headers?.["x-branch-id"];
  const requested = positiveBranchId(rawQueryBranch ?? body?.branchId ?? body?.branch_id);
  return { branchId: requested };
}

export function getBranchCondition(
  req: Request,
  branchIdColumn: any
): SQL | null {
  const { branchId } = getBranchScope(req);
  return branchId === null ? isNull(branchIdColumn) : eq(branchIdColumn, branchId);
}

/**
 * Extracts branch details when saving new record.
 */
export function extractBranchSaveData(
  req: Request,
  body: Record<string, any>
): { branchId: number | null; branchName: string | null } {
  const session = req.session as any;
  const role = String(session?.userRole ?? "").toLowerCase();
  const isStaff = ["staff", "technician", "manager"].includes(role);

  // If staff has branch
  if (isStaff) {
    const sId = positiveBranchId(session?.branchId);
    if (sId !== null) {
      return {
        branchId: sId,
        branchName: session?.branchName ? String(session.branchName) : null,
      };
    }
  }

  // If passed in body or headers
  const scope = getBranchScope(req, body);
  const rawId = scope.branchId;
  const rawName = body.branchName ?? body.branch_name ?? req.headers?.["x-branch-name"];

  if (rawId !== null) {
    let name: string | null = null;
    if (rawName) {
      try {
        name = decodeURIComponent(String(rawName));
      } catch {
        name = String(rawName);
        }
    }
    return { branchId: rawId, branchName: name };
  }

  return { branchId: null, branchName: null };
}
