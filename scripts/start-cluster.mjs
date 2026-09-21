import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";

if (!cluster.isPrimary) throw new Error("Koza TV küme başlatıcısı yalnız ana süreç olarak çalıştırılmalıdır.");

const requested = Number(process.env.KOZA_WORKERS || Math.min(4, availableParallelism()));
const workers = Math.min(Math.max(Number.isSafeInteger(requested) ? requested : 4, 1), 6);
const server = resolve(process.cwd(), "dist/standalone/server.js");
let stopping = false;
const exits = [];

cluster.setupPrimary({ exec: server });

function forkWorker() {
  const worker = cluster.fork();
  console.log("Koza TV worker başlatıldı:", worker.id);
}

for (let index = 0; index < workers; index += 1) forkWorker();

cluster.on("exit", (worker, code, signal) => {
  console.error("Koza TV worker kapandı:", { id: worker.id, code, signal });
  if (stopping) {
    if (Object.keys(cluster.workers || {}).length === 0) process.exit(0);
    return;
  }

  const now = Date.now();
  exits.push(now);
  while (exits.length && exits[0] < now - 60_000) exits.shift();
  if (exits.length > 10) {
    console.error("Bir dakika içinde çok fazla worker kaybı; systemd yeniden başlatması isteniyor.");
    process.exit(1);
  }
  forkWorker();
});

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log("Koza TV kümesi kapanıyor:", signal);
  for (const worker of Object.values(cluster.workers || {})) worker?.disconnect();
  const deadline = setTimeout(() => {
    for (const worker of Object.values(cluster.workers || {})) worker?.process.kill("SIGKILL");
    process.exit(1);
  }, 15_000);
  deadline.unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
