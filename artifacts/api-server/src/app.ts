import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import router from "./routes";
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes FIRST — must be registered before static files
app.use("/api", router);
app.use("/", router);

// Static files SECOND
app.use(express.static(path.join(__dirname, "public")));

// Catch-all LAST — never intercept API routes
app.use((_req, res) => {
  if (_req.path.startsWith("/api")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

export default app;
