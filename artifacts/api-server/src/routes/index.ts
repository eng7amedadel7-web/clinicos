import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use(settingsRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);

export default router;
