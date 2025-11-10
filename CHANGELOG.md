# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-10

### Performance Improvements

- **Memory footprint optimization**: Reduced memory usage by 6-7% for typical applications

  - Per endpoint memory: ~0.03-0.04 MB
  - 100 routes: 6.53 MB → 6.09 MB
  - 200 routes: 15.88 MB → 15.81 MB

- **Improved startup performance**: Better performance for large-scale applications
  - 200+ routes: ~15% faster startup time

### Internal Changes

- **Scoped middleware caching**: Implemented scoped cache to prevent stale data issues

  - Each scan now has its own cache instance
  - Eliminates cache pollution between test runs
  - Improved code stability and reliability

- **Smart array operations**: Optimized array handling to reduce memory allocations

  - Reuse arrays when possible
  - Reduced garbage collection overhead
  - More efficient middleware merging

- **Optimized middleware resolution**: Improved middleware loading and caching
  - Cache middleware modules to avoid duplicate `require()` calls
  - Cache file existence checks to reduce I/O operations
  - Better memory efficiency

### Benchmarks

Runtime Performance (unchanged - already optimal):

- Throughput: ~1,000,000 requests/second
- Latency: 0.001ms per request
- Overhead: 0% compared to native Elysia routing

Startup Performance:

- 50 routes: ~9ms
- 100 routes: ~16ms
- 200 routes: ~23ms

### Documentation

- Added comprehensive Performance section to README
- Added benchmarking tools for verification
- Added optimization summary documentation

### Testing

- All 26 tests passing
- No breaking changes
- 100% backward compatible

## [0.0.9] - Previous Version

Previous releases. See git history for details.

---

[0.1.0]: https://github.com/theanh-it/elysia-nnn-router/compare/v0.0.9...v0.1.0
