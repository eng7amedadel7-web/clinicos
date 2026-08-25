import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import inboxRouter from "./inbox";
import operationsRouter from "./operations";
import organizationRouter from "./organization";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use(settingsRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(inboxRouter);
router.use(operationsRouter);
router.use(organizationRouter);
router.use(billingRouter);

export default router;
