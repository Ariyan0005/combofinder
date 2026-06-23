import { Router, type IRouter } from "express";
import healthRouter from "./health";
import brandsRouter from "./brands";
import modelsRouter from "./models";
import combosRouter from "./combos";
import statsRouter from "./stats";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(brandsRouter);
router.use(modelsRouter);
router.use(combosRouter);
router.use(statsRouter);
router.use(searchRouter);

export default router;
