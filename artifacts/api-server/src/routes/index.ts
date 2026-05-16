import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import homeRouter from "./home.js";
import roomsRouter from "./rooms.js";
import devicesRouter from "./devices.js";
import modeRouter from "./mode.js";
import adminRouter from "./admin.js";
import complaintsRouter from "./complaints.js";
import billingRouter from "./billing.js";
import solarRouter from "./solar.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/home", homeRouter);
router.use("/rooms", roomsRouter);
router.use("/devices", devicesRouter);
router.use("/mode", modeRouter);
router.use("/admin", adminRouter);
router.use("/complaints", complaintsRouter);
router.use("/billing", billingRouter);
router.use("/solar", solarRouter);

export default router;
