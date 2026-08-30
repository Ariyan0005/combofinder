import { useEffect, useMemo, useState } from "react";

export type Branch = {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  staff: number;
  inventory: number;
  status: "Active" | "Inactive";
};

const ACTIVE_KEY = "poscert-active-branch";
const ACTIVE_NAME_KEY = "poscert-active-branch-name";
const ACTIVE_CODE_KEY = "poscert-active-branch-code";

export const DEFAULT_BRANCH: Branch = {
  id: "default-main",
  name: "Default Branch",
  code: "MAIN",
  city: "Main City",
  address: "Main Store",
  staff: 0,
  inventory: 0,
  status: "Active",
};

// Helper to get active branch headers for api requests
export function getActiveBranchHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const activeId = localStorage.getItem(ACTIVE_KEY) || "";
  const activeCode = localStorage.getItem(ACTIVE_CODE_KEY) || "";
  const activeName = localStorage.getItem(ACTIVE_NAME_KEY) || "";

  const headers: Record<string, string> = {};
  if (activeCode === "MAIN" || activeId === "default-main" || activeId === "MAIN" || activeId === "default") {
    headers["x-branch-id"] = "MAIN";
  } else if (activeId && activeId !== "all" && activeId !== "0") {
    headers["x-branch-id"] = activeId;
  }
  if (activeName) {
    headers["x-branch-name"] = encodeURIComponent(activeName);
  }
  return headers;
}

async function request(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!response.ok) {
    throw new Error((await response.json().catch(() => null))?.error || "Branch request failed");
  }
  return response.json();
}

function normalize(row: any): Branch {
  return {
    ...row,
    id: String(row.id),
    status: row.status || (row.isActive ? "Active" : "Inactive"),
  };
}

export async function getBranches(): Promise<Branch[]> {
  return (await request("/api/branches")).map(normalize);
}

export async function createBranch(
  data: Omit<Branch, "id" | "staff" | "inventory" | "status">
): Promise<Branch> {
  return normalize(
    await request("/api/branches", { method: "POST", body: JSON.stringify(data) })
  );
}

export async function updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
  return normalize(
    await request(`/api/branches/${id}`, { method: "PUT", body: JSON.stringify(data) })
  );
}

export function useBranchSelection() {
  const [branches, setBranches] = useState<Branch[]>([DEFAULT_BRANCH]);
  const [activeId, setActiveId] = useState<string>(() => localStorage.getItem(ACTIVE_KEY) || DEFAULT_BRANCH.id);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () =>
    getBranches()
      .then((rows) => {
        const hasMain = rows.some((r) => r.code === "MAIN" || r.id === DEFAULT_BRANCH.id);
        const list = hasMain ? rows : [DEFAULT_BRANCH, ...rows];
        setBranches(list);

        const currentActive = localStorage.getItem(ACTIVE_KEY) || "";
        const mainBranch = list.find((r) => r.code === "MAIN") || list[0] || DEFAULT_BRANCH;

        if (!currentActive || currentActive === "default-main" || currentActive === "MAIN" || currentActive === "default") {
          setActiveId(mainBranch.id);
          localStorage.setItem(ACTIVE_KEY, mainBranch.id);
          localStorage.setItem(ACTIVE_NAME_KEY, mainBranch.name);
          localStorage.setItem(ACTIVE_CODE_KEY, mainBranch.code);
        } else {
          const match = list.find((row) => row.id === currentActive);
          if (match) {
            setActiveId(match.id);
            localStorage.setItem(ACTIVE_NAME_KEY, match.name);
            localStorage.setItem(ACTIVE_CODE_KEY, match.code);
          } else {
            setActiveId(mainBranch.id);
            localStorage.setItem(ACTIVE_KEY, mainBranch.id);
            localStorage.setItem(ACTIVE_NAME_KEY, mainBranch.name);
            localStorage.setItem(ACTIVE_CODE_KEY, mainBranch.code);
          }
        }
      })
      .catch(() => {
        setBranches([DEFAULT_BRANCH]);
        setActiveId(DEFAULT_BRANCH.id);
      })
      .finally(() => setIsLoading(false));

  useEffect(() => {
    refresh();

    const handleBranchChange = () => {
      const stored = localStorage.getItem(ACTIVE_KEY) || "";
      if (stored) {
        setActiveId(stored);
      }
    };

    window.addEventListener("branch-changed", handleBranchChange);
    window.addEventListener("storage", handleBranchChange);
    return () => {
      window.removeEventListener("branch-changed", handleBranchChange);
      window.removeEventListener("storage", handleBranchChange);
    };
  }, []);

  const activeBranch = useMemo(() => {
    const mainBranch = branches.find((b) => b.code === "MAIN") || DEFAULT_BRANCH;
    if (!activeId || activeId === "default-main" || activeId === "MAIN" || activeId === "default" || activeId === mainBranch.id) {
      return mainBranch;
    }
    return branches.find((branch) => branch.id === activeId) || mainBranch || branches[0] || DEFAULT_BRANCH;
  }, [activeId, branches]);

  const selectBranch = (id: string) => {
    let targetId = id;
    let branchObj = branches.find((b) => b.id === id);

    if (id === "default-main" || id === "MAIN" || id === "default") {
      const main = branches.find((b) => b.code === "MAIN" || b.id === "default-main");
      targetId = main ? main.id : DEFAULT_BRANCH.id;
      branchObj = main || DEFAULT_BRANCH;
    }

    setActiveId(targetId);
    localStorage.setItem(ACTIVE_KEY, targetId);
    if (branchObj) {
      localStorage.setItem(ACTIVE_NAME_KEY, branchObj.name);
      localStorage.setItem(ACTIVE_CODE_KEY, branchObj.code);
    }
    window.dispatchEvent(new CustomEvent("branch-changed", { detail: { branchId: targetId, branch: branchObj } }));
  };

  return { branches, activeBranch, activeId, selectBranch, refresh, isLoading };
}
