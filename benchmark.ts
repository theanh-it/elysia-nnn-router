import { Elysia } from "elysia";

const ITERATIONS = 100_000;
const WARMUP = 5_000;
const RUNS = 3;

// --- Middlewares (logic phức tạp hơn) ---
const mwHeader = ({ set }: any) => {
  set.headers["x-request-id"] = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  set.headers["x-test"] = "true";
};

const mwTiming = ({ store }: any) => {
  (store as any).start = performance.now();
};

const mwValidate = ({ params, error }: any) => {
  const id = params?.id;
  if (id && !/^\d+$/.test(id)) {
    return error(400, { message: "Invalid id" });
  }
};

// --- Handlers: nhiều route, logic đa dạng ---
const getUsers = ({ params, store }: any) => {
  const elapsed = store?.start != null ? (performance.now() - store.start).toFixed(2) : "0";
  return { id: params.id, type: "user", elapsed: parseFloat(elapsed) };
};

const postUsers = async ({ body, store }: any) => {
  const elapsed = store?.start != null ? (performance.now() - store.start).toFixed(2) : "0";
  await Promise.resolve(); // giả lập async
  return { created: true, data: body ?? {}, elapsed: parseFloat(elapsed) };
};

const putUsers = ({ params, body }: any) => ({
  updated: params.id,
  data: body ?? {},
});

const deleteUsers = ({ params }: any) => ({ deleted: params.id });

const getPosts = ({ params, query }: any) => {
  const page = Number(query?.page) || 1;
  const limit = Math.min(Number(query?.limit) || 10, 100);
  return { id: params.id, page, limit, items: [] };
};

const getComments = ({ params }: any) => ({
  id: params.id,
  comments: [{ id: "1", text: "sample" }],
});

const getProducts = ({ params }: any) => {
  const meta = { requestedAt: new Date().toISOString() };
  return { productId: params.id, meta };
};

const getProductReviews = ({ params }: any) => ({
  productId: params.id,
  reviews: [],
  total: 0,
});

const getApiItems = ({ query }: any) => {
  const q = String(query?.q ?? "").trim();
  const limit = Math.min(Number(query?.limit) || 20, 100);
  return { q, limit, results: [] };
};

const getNested = ({ params }: any) => ({
  userId: params.id,
  postId: params.postId,
});

const beforeHandle = [mwHeader, mwTiming, mwValidate];

// --- Cách 1: Direct — tất cả route trên một Elysia ---
const appDirect = new Elysia()
  .get("/users/:id", getUsers, { beforeHandle })
  .post("/users", postUsers, { beforeHandle: [mwHeader, mwTiming] })
  .put("/users/:id", putUsers, { beforeHandle })
  .delete("/users/:id", deleteUsers, { beforeHandle })
  .get("/posts/:id", getPosts, { beforeHandle })
  .get("/comments/:id", getComments, { beforeHandle })
  .get("/products/:id", getProducts, { beforeHandle })
  .get("/products/:id/reviews", getProductReviews, { beforeHandle })
  .get("/api/v1/items", getApiItems, { beforeHandle: [mwHeader, mwTiming] })
  .get("/users/:id/posts/:postId", getNested, { beforeHandle });

// --- Cách 2: Scoped — từng route (hoặc nhóm) trên Elysia riêng, .use() (giống nnn-router) ---
const appScoped = new Elysia()
  .use(new Elysia().get("/users/:id", getUsers, { beforeHandle }))
  .use(new Elysia().post("/users", postUsers, { beforeHandle: [mwHeader, mwTiming] }))
  .use(new Elysia().put("/users/:id", putUsers, { beforeHandle }))
  .use(new Elysia().delete("/users/:id", deleteUsers, { beforeHandle }))
  .use(new Elysia().get("/posts/:id", getPosts, { beforeHandle }))
  .use(new Elysia().get("/comments/:id", getComments, { beforeHandle }))
  .use(new Elysia().get("/products/:id", getProducts, { beforeHandle }))
  .use(new Elysia().get("/products/:id/reviews", getProductReviews, { beforeHandle }))
  .use(new Elysia().get("/api/v1/items", getApiItems, { beforeHandle: [mwHeader, mwTiming] }))
  .use(new Elysia().get("/users/:id/posts/:postId", getNested, { beforeHandle }));

// --- Đo latency ---
const toUrl = (pathOrUrl: string) =>
  pathOrUrl.startsWith("http") ? pathOrUrl : `http://localhost${pathOrUrl}`;

const warmup = async (app: Elysia, pathOrUrl: string) => {
  const url = toUrl(pathOrUrl);
  for (let i = 0; i < WARMUP; i++) {
    await app.handle(new Request(url));
  }
};

const runOnce = async (
  app: Elysia,
  pathOrUrl: string
): Promise<{ avgLatency: number; rps: number; ok: boolean }> => {
  const url = toUrl(pathOrUrl);
  const start = performance.now();
  let ok = true;
  for (let i = 0; i < ITERATIONS; i++) {
    const res = await app.handle(new Request(url));
    if (res.status !== 200) ok = false;
  }
  const duration = performance.now() - start;
  return {
    avgLatency: duration / ITERATIONS,
    rps: Math.round(ITERATIONS / (duration / 1000)),
    ok,
  };
};

const benchmark = async (
  app: Elysia,
  name: string,
  path: string
): Promise<{ avgLatency: number; rps: number }> => {
  await warmup(app, path);
  const latencies: number[] = [];
  let totalRps = 0;
  for (let r = 0; r < RUNS; r++) {
    const { avgLatency, rps, ok } = await runOnce(app, path);
    if (!ok) console.warn(`  [${name}] Một số response không 200`);
    latencies.push(avgLatency);
    totalRps += rps;
  }
  latencies.sort((a, b) => a - b);
  const medianLatency = latencies[Math.floor(RUNS / 2)];
  const avgRps = Math.round(totalRps / RUNS);
  console.log(`${name}:`);
  console.log(`  Median latency: ${medianLatency.toFixed(3)}ms (${RUNS} runs)`);
  console.log(`  Throughput: ~${avgRps.toLocaleString()} req/s`);
  console.log();
  return { avgLatency: medianLatency, rps: avgRps };
};

// --- Các path đo (đại diện cho nhiều loại route) ---
const PATHS = [
  { path: "/users/123", label: "GET /users/:id" },
  { path: "/users/456/posts/789", label: "GET /users/:id/posts/:postId" },
  { path: "/api/v1/items?q=test&limit=10", label: "GET /api/v1/items?query" },
];

console.log(
  `🚀 Benchmark: nhiều route + logic phức tạp, 2 cách khai báo\n   Routes: 10 (GET/POST/PUT/DELETE, nested, query). Middleware: header, timing, validate.\n   ${ITERATIONS.toLocaleString()} requests × ${RUNS} runs (median), warmup ${WARMUP}\n`
);

const results: { direct: { avgLatency: number; rps: number }; scoped: { avgLatency: number; rps: number } }[] = [];

for (const { path, label } of PATHS) {
  const pathForRequest = path.startsWith("http") ? path : `http://localhost${path}`;
  console.log(`--- ${label} ---`);
  const [rDirect, rScoped] = await Promise.all([
    benchmark(appDirect, "  Direct", pathForRequest),
    benchmark(appScoped, "  Scoped", pathForRequest),
  ]);
  results.push({ direct: rDirect, scoped: rScoped });
}

// --- So sánh tổng ---
const avgDirect = results.reduce((a, r) => a + r.direct.avgLatency, 0) / results.length;
const avgScoped = results.reduce((a, r) => a + r.scoped.avgLatency, 0) / results.length;
const overhead = (avgScoped / avgDirect - 1) * 100;

console.log("📊 So sánh (trung bình các path):");
console.log(
  `  Scoped so với Direct: ${overhead >= 0 ? "+" : ""}${overhead.toFixed(1)}% latency`
);
console.log();
if (Math.abs(overhead) < 5) {
  console.log("✅ Kết luận: Hai cách khai báo cho hiệu năng tương đương (<5% chênh lệch).");
} else if (Math.abs(overhead) < 20) {
  console.log("✅ Kết luận: Chênh lệch chấp nhận được (5–20%). Scoped (file-based) vẫn khả thi.");
} else {
  console.log("⚠️  Kết luận: Chênh lệch đáng kể (>20%).");
}
