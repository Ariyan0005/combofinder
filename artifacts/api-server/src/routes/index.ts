import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import brandsRouter from "./brands";
import modelsRouter from "./models";
import combosRouter from "./combos";
import statsRouter from "./stats";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

function requireAuth(req: any, res: any, next: any) {
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
router.use(searchRouter);

export default router;
