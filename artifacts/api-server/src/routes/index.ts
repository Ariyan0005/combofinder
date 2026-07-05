import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import brandsRouter from "./brands";
import modelsRouter from "./models";
import combosRouter from "./combos";
import statsRouter from "./stats";
import searchRouter from "./search";
import partsRouter from "./parts";
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

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

function requireAuth(req: any, res: any, next: any) {
  // NOTE: GET requests are intentionally open to allow the web and mobile
  // clients to read data without a session cookie during development.
  // Before going to production, tighten this to an explicit allowlist of
  // public GET endpoints (e.g. /api/brands, /api/models, /api/search).
  if (req.method === "GET") {
    return next();
  }
  if (req.session?.authenticated) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

router.use(requireAuth);
router.use(brandsRouter);
router.use(modelsRouter);
router.use(combosRouter);
router.use(statsRouter);
router.use(monthlyStatsRouter);
router.use(searchRouter);
router.use("/parts", partsRouter);
router.use("/customers", customersRouter);
router.use("/repairs", repairsRouter);
router.use("/inventory", inventoryRouter);
router.use("/knowledge-base", knowledgeBaseRouter);
router.use("/expenses", expensesRouter);
router.use("/users", usersRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/issues-fixes", issuesFixesRouter);
router.use("/schematics", schematicsRouter);
router.use("/documents", documentsRouter);
router.use("/videos", videosRouter);
router.use("/announcements", announcementsRouter);
router.use("/repair-categories", repairCategoriesRouter);
router.use("/inventory-categories", inventoryCategoriesRouter);
router.use("/suppliers", suppliersRouter);
router.use("/transactions", transactionsRouter);
router.use("/activity-logs", activityLogsRouter);
router.use("/stock-movements", stockMovementsRouter);
router.use("/sales", salesRouter);

export default router;
