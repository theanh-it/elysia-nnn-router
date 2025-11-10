import { nnnRouterPlugin } from "./src/index";
import { Elysia } from "elysia";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

// Helper để format memory
const formatMemory = (bytes: number) => {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

// Helper để đo memory
const measureMemory = () => {
  if (global.gc) {
    global.gc();
  }
  return process.memoryUsage();
};

// Tạo test routes
const createTestRoutes = (dir: string, count: number) => {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  // Tạo middleware ở root
  writeFileSync(
    join(dir, "_middleware.ts"),
    `export default ({ set }: any) => { set.headers["x-root"] = "true"; };`
  );

  // Tạo routes
  for (let i = 0; i < count; i++) {
    const routeDir = join(dir, `route-${i}`);
    mkdirSync(routeDir, { recursive: true });

    // Middleware cho route
    if (i % 5 === 0) {
      writeFileSync(
        join(routeDir, "_middleware.ts"),
        `export default ({ set }: any) => { set.headers["x-route-${i}"] = "true"; };`
      );
    }

    // GET endpoint
    writeFileSync(
      join(routeDir, "get.ts"),
      `export default () => ({ route: ${i}, method: "GET" });`
    );

    // POST endpoint
    writeFileSync(
      join(routeDir, "post.ts"),
      `export default () => ({ route: ${i}, method: "POST" });`
    );
  }
};

// Test với số lượng routes khác nhau
const testMemory = async (routeCount: number) => {
  const testDir = join(process.cwd(), "test-routes-memory");

  console.log(`\n📊 Testing với ${routeCount} routes (${routeCount * 2} endpoints)...`);

  // Đo baseline memory (dùng external vì nó ổn định hơn)
  const baselineMemory = measureMemory();
  const baselineExternal = baselineMemory.external;

  // Tạo routes
  createTestRoutes(testDir, routeCount);

  // Load router
  const startTime = performance.now();
  const app = new Elysia().use(nnnRouterPlugin({ dir: "test-routes-memory" }));
  const loadTime = performance.now() - startTime;

  // Đo memory sau khi load router
  const afterLoadMemory = measureMemory();

  // Make some requests để đảm bảo routes hoạt động
  await app.handle(new Request("http://localhost/route-0"));
  if (routeCount > 5) {
    await app.handle(new Request("http://localhost/route-5", { method: "POST" }));
  }

  // Đo memory sau requests
  const afterRequestsMemory = measureMemory();

  // Cleanup
  rmSync(testDir, { recursive: true, force: true });

  // Tính toán - dùng RSS (Resident Set Size) vì nó phản ánh memory thực tế hơn
  const routerMemory = afterLoadMemory.rss - baselineMemory.rss;
  const heapMemory = afterLoadMemory.heapUsed - baselineMemory.heapUsed;
  const externalMemory = afterLoadMemory.external - baselineMemory.external;
  const perRouteMemory = routerMemory / routeCount;
  const perEndpointMemory = routerMemory / (routeCount * 2);

  console.log(`  Baseline RSS: ${formatMemory(baselineMemory.rss)}`);
  console.log(`  After load RSS: ${formatMemory(afterLoadMemory.rss)}`);
  console.log(`  Router RSS: ${formatMemory(routerMemory)}`);
  console.log(`  Heap delta: ${formatMemory(heapMemory)}`);
  console.log(`  External delta: ${formatMemory(externalMemory)}`);
  console.log(`  Load time: ${loadTime.toFixed(2)}ms`);
  console.log(`  Per route: ${formatMemory(perRouteMemory)}`);
  console.log(`  Per endpoint: ${formatMemory(perEndpointMemory)}`);

  return {
    routeCount,
    routerMemory,
    heapMemory,
    externalMemory,
    loadTime,
    perRouteMemory,
    perEndpointMemory,
  };
};

// Run tests
console.log("🧪 Memory Footprint Benchmark");
console.log("============================");

const results = [
  await testMemory(10),
  await testMemory(50),
  await testMemory(100),
  await testMemory(200),
];

console.log("\n📈 Summary:");
console.log("┌─────────┬──────────────┬────────────┬────────────────┬────────────┐");
console.log("│ Routes  │ Total Memory │ Per Route  │ Per Endpoint   │ Load Time  │");
console.log("├─────────┼──────────────┼────────────┼────────────────┼────────────┤");
results.forEach((r) => {
  console.log(
    `│ ${r.routeCount.toString().padEnd(7)} │ ${formatMemory(r.routerMemory).padEnd(12)} │ ${formatMemory(r.perRouteMemory).padEnd(10)} │ ${formatMemory(r.perEndpointMemory).padEnd(14)} │ ${r.loadTime.toFixed(0).padEnd(6)}ms   │`
  );
});
console.log("└─────────┴──────────────┴────────────┴────────────────┴────────────┘");

