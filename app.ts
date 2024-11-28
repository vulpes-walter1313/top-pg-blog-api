import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import http from "node:http";
import HttpError from "./lib/httpError";
import morgan from "morgan";
import indexRouter from "./routes/indexRouter";
import postsRouter from "./routes/postsRouter";
import db from "./db/db";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.use(express.json());
app.use(
  cors({
    origin: [
      process.env.ADMIN_FE_URL ?? "http://localhost:5173",
      process.env.FE_URL ?? "http://localhost:3001",
    ],
  }),
);
app.set("port", PORT);

if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: "Please cool down on the requests.",
  });
  app.use(limiter);
  app.use(morgan("common"));
  app.use(helmet());
} else {
  app.use(morgan("dev"));
}

app.use("/", indexRouter);
app.use("/posts", postsRouter);

// catch all 404 and forward to Error Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new HttpError("Page does not exist.", 404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({ success: false, msg: err.message });
});

const server = http.createServer(app);
server.listen(PORT);
server.on("error", onError);
server.on("listening", onListening);
async function onError(error: Error & { syscall?: string; code?: string }) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      await db.$disconnect();
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      await db.$disconnect();
      process.exit(1);
      break;
    default:
      await db.$disconnect();
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  console.log("Listening on " + bind);
}

//graceful shutdowns
process.on("SIGHUP", async () => {
  await db.$disconnect();
  server.close((err) => {
    console.log(err);
  });
  process.exit(1);
});

process.on("SIGINT", async () => {
  await db.$disconnect();
  server.close((err) => {
    console.log(err);
  });
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await db.$disconnect();
  server.close((err) => {
    console.log(err);
  });
  process.exit(1);
});

process.on("exit", async () => {
  await db.$disconnect();
  server.close((err) => {
    console.log(err);
  });
  process.exit(0);
});
