import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import brandsRouter from "./brands";
import modelsRouter from "./models";
import compatibilitiesRouter from "./compatibilities";
import statsRouter from "./stats";
import searchRouter from "./search";
import customersRouter from "./customers";
import repairsRouter from "./repairs";
import inventoryRouter from "./inventory";
import knowledgeBaseRouter from "./knowledge-base";
import expensesRouter from "./expenses";
import monthlyStatsRouter from "./monthly-stats";
import usersRouter from "./users";
import subscriptionsRouter from "./subscriptions";
import issuesFixesRouter from "./issues-fixes";
import schematicsRouter from "./schematics";
import documentsRouter from "./documents";
import videosRouter from "./videos";
import announcementsRouter from "./announcements";
import repairCategoriesRouter from "./repair-categories";
import inventoryCategoriesRouter from "./inventory-categories";
import suppliersRouter from "./suppliers";
import transactionsRouter from "./transactions";
import activityLogsRouter from "./activity-logs";
import stockMovementsRouter from "./stock-movements";
import salesRouter from "./sales";
import ledgerRouter from "./ledger";
import supplierPurchasesRouter from "./supplier-purchases";
import batteryCompatRouter from "./battery-compat";
import icCompatRouter from "./ic-compat";
import migrateRouter from "./migrate";
import backupRouter from "./backup";
import salesSummaryRouter from "./sales-summary";
import staffRouter from "./staff";
import partsSuppliersRouter from "./parts-suppliers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

// Requires auth for write operations (mutations) on shared/global catalog data only
// User shop data (inventory, sales, repairs, customers, etc.) is handled by requireUserAuth
function requireAdminMutation(req: any, res: any, next: any) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();

  // ONLY check admin permissions if the request is targeting global catalog endpoints
  const path = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
  const isCatalogEndpoint =
    path.startsWith("/categories") ||
    path.startsWith("/brands") ||
    path.startsWith("/models") ||
    path.startsWith("/compatibilities") ||
    path.startsWith("/battery-compat") ||
    path.startsWith("/ic-compat") ||
    path.startsWith("/knowledge-base") ||
    path.startsWith("/issues-fixes") ||
    path.startsWith("/schematics") ||
    path.startsWith("/videos") ||
    path.startsWith("/announcements") ||
    path.startsWith("/documents");

  if (!isCatalogEndpoint) {
    return next();
  }

  if (!req.session?.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const role: string = req.session?.userRole ?? "";
  const isAdmin = role === "Admin" || role === "admin" || role === "superadmin";
  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }
  req.userId = req.session.userId;
  next();
}

// Requires auth for ALL methods — used for user-scoped data
// IMPORTANT: also requires session.userId to be set
function requireUserAuth(req: any, res: any, next: any) {
  if (req.session?.authenticated && req.session?.userId) {
    req.userId = req.session.userId;
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

function requireOwnerAuth(req: any, res: any, next: any) {
  if (!req.session?.authenticated || !req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  if (String(req.session.userRole ?? "").toLowerCase() === "staff") {
    res.status(403).json({ error: "Owner access required" }); return;
  }
  req.userId = req.session.userId;
  next();
}

// Requires admin role — used for admin-panel routes (users, subscriptions)
function requireAdminAuth(req: any, res: any, next: any) {
  if (!req.session?.authenticated) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  const role: string = req.session?.userRole ?? "";
  const isAdmin = role === "Admin" || role === "admin" || role === "superadmin";
  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden: admin access required" }); return;
  }
  next();
}

// Shared catalog routes (GET is public; mutations require Admin authentication)
const catalogRouter = Router();
catalogRouter.use(requireAdminMutation);
catalogRouter.use(categoriesRouter);
catalogRouter.use(brandsRouter);
catalogRouter.use(modelsRouter);
catalogRouter.use(compatibilitiesRouter);
catalogRouter.use(searchRouter);
catalogRouter.use("/knowledge-base", knowledgeBaseRouter);
catalogRouter.use(batteryCompatRouter);
catalogRouter.use(icCompatRouter);
catalogRouter.use("/issues-fixes", issuesFixesRouter);
catalogRouter.use("/schematics", schematicsRouter);
catalogRouter.use("/videos", videosRouter);
catalogRouter.use("/announcements", announcementsRouter);
catalogRouter.use("/documents", documentsRouter);

router.use(catalogRouter);

// Public / session-aware stats routes
router.use(statsRouter);
router.use(monthlyStatsRouter);

// User-scoped routes — ALL methods require auth + userId injection
router.use("/customers", requireUserAuth, customersRouter);
router.use("/repairs", requireUserAuth, repairsRouter);
router.use("/inventory", requireUserAuth, inventoryRouter);
router.use("/expenses", requireOwnerAuth, expensesRouter);
router.use("/suppliers", requireUserAuth, suppliersRouter);
router.use("/inventory-categories", requireUserAuth, inventoryCategoriesRouter);
router.use("/stock-movements", requireUserAuth, stockMovementsRouter);
router.use("/sales", requireUserAuth, salesRouter);
router.use("/ledger", requireUserAuth, ledgerRouter);
router.use("/supplier-purchases", requireUserAuth, supplierPurchasesRouter);
router.use("/staff", requireOwnerAuth, staffRouter);

router.use(requireUserAuth, migrateRouter);
router.use(requireOwnerAuth, backupRouter);
router.use(requireUserAuth, salesSummaryRouter);

// Admin-only data & system logs
router.use("/activity-logs", requireAdminAuth, activityLogsRouter);
router.use("/repair-categories", requireAdminAuth, repairCategoriesRouter);
router.use("/users", requireAdminAuth, usersRouter);
router.use("/subscriptions", requireAdminAuth, subscriptionsRouter);

// Parts Suppliers directory — public GET, admin auth enforced inside the router
router.use("/parts-suppliers", partsSuppliersRouter);

export default router;
