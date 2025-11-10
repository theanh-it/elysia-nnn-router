import { Elysia } from "elysia";

const ITERATIONS = 100_000;

// Test 1: Router gốc (baseline)
const appDirect = new Elysia()
  .get("/users/:id", ({ params }) => ({ id: params.id }))
  .get("/posts/:id", ({ params }) => ({ id: params.id }))
  .get("/comments/:id", ({ params }) => ({ id: params.id }));

// Test 2: Sử dụng .use() với scoped instances (như NNN Router)
const appWithScoped = new Elysia();
const scoped1 = new Elysia().get("/users/:id", ({ params }) => ({
  id: params.id,
}));
const scoped2 = new Elysia().get("/posts/:id", ({ params }) => ({
  id: params.id,
}));
const scoped3 = new Elysia().get("/comments/:id", ({ params }) => ({
  id: params.id,
}));
appWithScoped.use(scoped1).use(scoped2).use(scoped3);

// Test 3: Với middleware
const middleware = ({ set }: any) => {
  set.headers["x-test"] = "true";
};

const appDirectWithMw = new Elysia().get(
  "/users/:id",
  ({ params }) => ({ id: params.id }),
  {
    beforeHandle: [middleware],
  }
);

const appScopedWithMw = new Elysia();
const scopedMw = new Elysia().get(
  "/users/:id",
  ({ params }) => ({ id: params.id }),
  {
    beforeHandle: [middleware],
  }
);
appScopedWithMw.use(scopedMw);

// Benchmark function
const benchmark = async (app: Elysia, name: string, path: string) => {
  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    await app.handle(new Request(`http://localhost${path}`));
  }

  const duration = performance.now() - start;
  const rps = Math.round(ITERATIONS / (duration / 1000));
  const avgLatency = (duration / ITERATIONS).toFixed(3);

  console.log(`${name}:`);
  console.log(`  Total: ${duration.toFixed(2)}ms`);
  console.log(`  Avg Latency: ${avgLatency}ms`);
  console.log(`  Throughput: ${rps.toLocaleString()} req/s`);
  console.log();

  return { duration, avgLatency: parseFloat(avgLatency), rps };
};

// Run benchmarks
console.log(`🚀 Benchmark với ${ITERATIONS.toLocaleString()} requests\n`);

const results = {
  direct: await benchmark(appDirect, "1. Router gốc (Direct)", "/users/123"),
  scoped: await benchmark(
    appWithScoped,
    "2. Router với .use() (Scoped)",
    "/users/123"
  ),
  directMw: await benchmark(
    appDirectWithMw,
    "3. Router gốc + Middleware",
    "/users/123"
  ),
  scopedMw: await benchmark(
    appScopedWithMw,
    "4. Router scoped + Middleware",
    "/users/123"
  ),
};

// So sánh
console.log("📊 So sánh (% so với router gốc):");
console.log(
  `  Scoped overhead: ${(
    (results.scoped.avgLatency / results.direct.avgLatency - 1) *
    100
  ).toFixed(1)}%`
);
console.log(
  `  Scoped + MW overhead: ${(
    (results.scopedMw.avgLatency / results.directMw.avgLatency - 1) *
    100
  ).toFixed(1)}%`
);
console.log();

console.log("✅ KẾT LUẬN:");
if (results.scoped.avgLatency / results.direct.avgLatency < 1.05) {
  console.log("  → Overhead KHÔNG ĐÁNG KỂ (<5%)");
  console.log("  → File-based routing hoàn toàn khả thi!");
} else if (results.scoped.avgLatency / results.direct.avgLatency < 1.2) {
  console.log("  → Overhead CHẤP NHẬN ĐƯỢC (5-20%)");
  console.log("  → File-based routing vẫn tốt cho hầu hết use cases");
} else {
  console.log("  → Overhead LỚN (>20%)");
  console.log("  → Cần tối ưu hóa implementation");
}
