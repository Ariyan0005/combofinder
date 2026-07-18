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

// CORS — explicit allowlist in production, permissive in dev
const CORS_ORIGINS = (process.env["CORS_ORIGINS"] ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);
const HARDCODED_ORIGINS = ["https://finder.iunlockd.com", "https://admin.iunlockd.com"];
const ALLOWED_ORIGINS = [...new Set([...HARDCODED_ORIGINS, ...CORS_ORIGINS])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile apps / curl
    if (!isProd) return callback(null, true); // dev: allow all
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProd = process.env.NODE_ENV === "production";

// Fail fast in production if session secret not set
if (isProd && !process.env["SESSION_SECRET"]) {
  logger.error("FATAL: SESSION_SECRET environment variable must be set in production");
  process.exit(1);
}

app.use(
  session({
    secret: process.env["SESSION_SECRET"] ?? "combofinder-dev-secret-not-for-prod",
    resave: false,
    saveUninitialized: false,
    // Persist sessions in PostgreSQL so they survive server restarts.
    // Without this, every restart wipes all sessions → users get 401 on backup.
    store: new PgSession({
      // Use the same DB URL the rest of the app uses: SUPABASE_DATABASE_URL takes
      // priority (VPS production), falling back to DATABASE_URL (Replit/local dev).
      conString: process.env["SUPABASE_DATABASE_URL"] ?? process.env["DATABASE_URL"],
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
  logger.error({ err }, "Unhandled error");
  // Never expose internal DB details or stack traces to clients in production
  const message: string = isProd
    ? (status < 500 ? (err.message ?? "Bad request") : "Internal server error")
    : (() => {
        const cause = (err.cause as any)?.message ?? (err.cause as any)?.detail ?? "";
        return cause ? `${err.message ?? "Internal server error"} — DB: ${cause}` : (err.message ?? "Internal server error");
      })();
  res.status(status).json({ error: message });
});

export default app;
