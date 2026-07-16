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

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

// Requires auth for write operations (mutations)
function requireAuth(req: any, res: any, next: any) {
  if (req.method === "GET") return next();
  if (req.session?.authenticated) {
    req.userId = req.session.userId;
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
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

router.use(requireAuth);

// Public / shared data routes (no user scope needed)
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(modelsRouter);
router.use(compatibilitiesRouter);
router.use(statsRouter); // stats router reads userId from session internally — no requireUserAuth needed
router.use(monthlyStatsRouter);
router.use(searchRouter);
router.use("/knowledge-base", knowledgeBaseRouter);
router.use(batteryCompatRouter);
router.use(icCompatRouter);
router.use("/issues-fixes", issuesFixesRouter);
router.use("/schematics", schematicsRouter);
router.use("/videos", videosRouter);
router.use("/announcements", announcementsRouter);

// User-scoped routes — ALL methods require auth + userId injection
router.use("/customers", requireUserAuth, customersRouter);
router.use("/repairs", requireUserAuth, repairsRouter);
router.use("/inventory", requireUserAuth, inventoryRouter);
router.use("/expenses", requireUserAuth, expensesRouter);
router.use("/suppliers", requireUserAuth, suppliersRouter);
router.use("/inventory-categories", requireUserAuth, inventoryCategoriesRouter);
router.use("/repair-categories", requireUserAuth, repairCategoriesRouter);
router.use("/transactions", requireUserAuth, transactionsRouter);
router.use("/activity-logs", requireUserAuth, activityLogsRouter);
router.use("/stock-movements", requireUserAuth, stockMovementsRouter);
router.use("/sales", requireUserAuth, salesRouter);
router.use("/ledger", requireUserAuth, ledgerRouter);
router.use("/supplier-purchases", requireUserAuth, supplierPurchasesRouter);

router.use("/users", usersRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/documents", documentsRouter);

export default router;
