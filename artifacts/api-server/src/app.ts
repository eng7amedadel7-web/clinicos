import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { paddleWebhook } from "./routes/billing";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Vercel's Node adapter may pre-populate req.cookies before Express middleware runs.
// cookie-parser returns early when that field exists, which skips req.secret and
// makes signed session cookies fail at res.cookie({ signed: true }).
app.use((req, _res, next) => {
  delete (req as typeof req & { cookies?: unknown }).cookies;
  delete (req as typeof req & { signedCookies?: unknown }).signedCookies;
  next();
});
app.use(cookieParser(process.env.SESSION_SECRET ?? "development-session-secret"));
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), paddleWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
