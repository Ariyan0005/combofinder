import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const PgSession = connectPgSimple(session);

const app: Express = express();

// Trust the reverse-proxy (nginx) so req.secure, req.ip, etc. are correct in production
app.set("trust proxy", 1);

// Security headers — sets X-Frame-Options, X-Content-Type-Options, HSTS, etc.
app.use(helmet());

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

// Only allow requests from the configured origin(s).
// Falls back to no wildcard — credential-carrying cross-origin requests are
// only allowed from origins that are explicitly listed.
const allowedOrigins = (process.env["CORS_ORIGIN"] ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0
      ? (origin, callback) => {
          // Same-origin requests (origin === undefined) are always allowed.
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
          }
        }
      : false,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: (() => {
      const s = process.env["SESSION_SECRET"];
      if (!s) throw new Error("SESSION_SECRET environment variable is required but not set.");
      return s;
    })(),
    resave: false,
    saveUninitialized: false,
    // Persist sessions in PostgreSQL so they survive server restarts.
    // Without this, every restart wipes all sessions → users get 401 on backup.
    store: new PgSession({
      // Use the same DB URL the rest of the app uses: SUPABASE_DATABASE_URL takes
      // priority (VPS production), falling back to DATABASE_URL (Replit/local dev).
      conString: process.env["SUPABASE_DATABASE_URL"] ?? process.env["DATABASE_URL"],
      tableName: "user_sessions",
      createTableIfMissing: false,  // table created by migrate.cjs — no runtime file read needed
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
  // Log full error details server-side only — never expose DB internals to clients.
  logger.error({ err }, "Unhandled error");
  const isProd = process.env.NODE_ENV === "production";
  const message: string = isProd
    ? (status < 500 ? (err.message ?? "Request error") : "Internal server error")
    : (err.message ?? "Internal server error");
  res.status(status).json({ error: message });
});

export default app;
