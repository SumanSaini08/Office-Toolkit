import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import sitemapRouter from "./routes/sitemap";
import { logger } from "./lib/logger";

const app: Express = express();

const corsOriginsEnv = process.env["CORS_ORIGINS"]?.trim();
const allowedOrigins = corsOriginsEnv
  ? corsOriginsEnv.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["https://office-toolkit.vercel.app", "http://localhost:5173"];

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
app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({
  type: (request) => {
    const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
    return !contentType.startsWith("application/json") && !contentType.startsWith("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data");
  },
  limit: "25mb",
}));

app.use("/api", router);

// Public, canonical XML endpoints live at the site root (not under /api).
app.use(sitemapRouter);

export default app;
