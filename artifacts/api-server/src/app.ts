import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const PgSession = connectPgSimple(session);

const app: Express = express();

// Trust the reverse-proxy (nginx) so req.secure, req.ip, etc. are correct in production
app.set("trust proxy", 1);

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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env["SESSION_SECRET"] ?? "combofinder-secret",
    resave: false,
    saveUninitialized: false,
    // Persist sessions in PostgreSQL so they survive server restarts.
    // Without this, every restart wipes all sessions → users get 401 on backup.
    store: new PgSession({
      conString: process.env["DATABASE_URL"],
      tableName: "user_sessions",
      createTableIfMissing: true,   // auto-creates the table on first run
      ttl: 7 * 24 * 60 * 60,       // 7 days in seconds
    }),
    cookie: {
      httpOnly: true,
      secure: isProd,        // Send only over HTTPS in production
      sameSite: "lax",       // Protect against CSRF; works for same-site AJAX
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

// Global JSON error handler — prevents Express from returning an HTML error page.
// Must have exactly 4 parameters so Express recognises it as an error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status: number =
    typeof err.status === "number" ? err.status :
    typeof err.statusCode === "number" ? err.statusCode : 500;
  const cause = (err.cause as any)?.message ?? (err.cause as any)?.detail ?? "";
  const message: string = cause
    ? `${err.message ?? "Internal server error"} — DB: ${cause}`
    : (err.message ?? "Internal server error");
  logger.error({ err }, "Unhandled error");
  res.status(status).json({ error: message });
});

export default app;
