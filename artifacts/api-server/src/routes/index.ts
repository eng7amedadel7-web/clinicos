import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import inboxRouter from "./inbox";
import operationsRouter from "./operations";
import voiceRouter from "./voice";
import organizationRouter from "./organization";
import billingRouter from "./billing";
import queueRouter from "./queue";
import inboundRouter from "./inbound";
import analyticsRouter from "./analytics";
import templatesRouter from "./templates";
import adminRouter from "./admin";
import importRouter from "./import";
import integrationsRouter from "./integrations";
import channelsRouter from "./channels";
import clinicSetupRouter from "./clinic-setup";
import cronRouter from "./cron";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use(settingsRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(inboxRouter);
router.use(inboundRouter);
router.use(operationsRouter);
router.use(voiceRouter);
router.use(organizationRouter);
router.use(billingRouter);
router.use(queueRouter);
router.use("/analytics", analyticsRouter);
router.use(templatesRouter);
router.use(adminRouter);
router.use(importRouter);
router.use(integrationsRouter);
router.use(channelsRouter);
router.use(clinicSetupRouter);
// Mounted without a prefix on purpose: paths are absolute (/cron/reminders,
// /cron/trial-expiry) so they match the Vercel Cron entries in vercel.json
// (/api/cron/reminders, /api/cron/trial-expiry) after the /api rewrite.
router.use(cronRouter);

export default router;
