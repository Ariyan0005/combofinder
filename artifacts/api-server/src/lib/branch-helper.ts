import { SQL, eq } from "drizzle-orm";
import type { Request } from "express";

/**
 * Resolves optional branch filter condition.
 * 
 * Rules:
 * 1. If staff/manager is logged in and assigned to a specific branch -> returns eq(column, branchId)
 * 2. If the user is an owner/admin and passed a specific sub-branch ID -> returns eq(column, branchId)
 * 3. In ALL OTHER CASES (Default store, Main branch, "all", empty, legacy user) -> returns null
 *    (which means the query will ONLY filter by user_id = :userId and show all data without hiding anything!).
 */
export function getBranchCondition(
  req: Request,
  branchIdColumn: any
): SQL | null {
  const session = req.session as any;
  const isStaff = session?.userRole === "Staff" || session?.userRole === "Technician" || session?.userRole === "Manager";
  
  // 1. If staff has a specific branch assignment (e.g. branchId is "2" or 2)
  if (isStaff && session?.branchId && String(session.branchId).trim() !== "" && String(session.branchId).toLowerCase() !== "main" && String(session.branchId).toLowerCase() !== "default") {
    const sBranchId = Number(session.branchId);
    if (!Number.isNaN(sBranchId) && sBranchId > 0) {
      return eq(branchIdColumn, sBranchId);
    }
  }

  // 2. If query or header explicitly requested a specific sub-branch
  const rawQueryBranch = (req.query?.branchId ?? req.query?.branch_id ?? req.headers?.["x-branch-id"]) as string | undefined;
  if (rawQueryBranch) {
    const str = String(rawQueryBranch).trim();
    if (str !== "" && str !== "all" && str !== "0" && str !== "default-main" && str.toUpperCase() !== "MAIN" && str.toLowerCase() !== "default") {
      const num = Number(str);
      if (!Number.isNaN(num) && num > 0) {
        return eq(branchIdColumn, num);
      }
    }
  }

  // Default: no branch filter (pure user_id query, all records visible!)
  return null;
}

/**
 * Extracts branch details when saving new record.
 */
export function extractBranchSaveData(
  req: Request,
  body: Record<string, any>
): { branchId: number | null; branchName: string | null } {
  const session = req.session as any;
  const isStaff = session?.userRole === "Staff" || session?.userRole === "Technician" || session?.userRole === "Manager";

  // If staff has branch
  if (isStaff && session?.branchId) {
    const sId = Number(session.branchId);
    if (!Number.isNaN(sId) && sId > 0) {
      return {
        branchId: sId,
        branchName: session?.branchName ? String(session.branchName) : null,
      };
    }
  }

  // If passed in body or headers
  const rawId = body.branchId ?? body.branch_id ?? req.headers?.["x-branch-id"];
  const rawName = body.branchName ?? body.branch_name ?? req.headers?.["x-branch-name"];

  if (rawId) {
    const str = String(rawId).trim();
    if (str !== "" && str !== "all" && str !== "0" && str !== "default-main" && str.toUpperCase() !== "MAIN" && str.toLowerCase() !== "default") {
      const num = Number(str);
      if (!Number.isNaN(num) && num > 0) {
        let name: string | null = null;
        if (rawName) {
          try {
            name = decodeURIComponent(String(rawName));
          } catch {
            name = String(rawName);
          }
        }
        return {
          branchId: num,
          branchName: name,
        };
      }
    }
  }

  return { branchId: null, branchName: null };
}
