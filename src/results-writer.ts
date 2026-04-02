/**
 * Test results manifest and record registry persistence.
 *
 * Produces a Playwright-compatible results.json so the existing CI
 * quality-gate workflow can parse it without changes.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types — results.json (Playwright JSON reporter shape)
// ---------------------------------------------------------------------------

interface TestError {
  message: string;
  stack?: string;
}

interface TestResult {
  error?: TestError;
  status: "passed" | "failed" | "skipped";
  duration: number;
}

interface TestSpec {
  title: string;
  ok: boolean;
  tags?: string[];
  tests: Array<{ results: TestResult[] }>;
}

interface TestSuite {
  title: string;
  specs: TestSpec[];
}

interface ResultsManifest {
  suites: TestSuite[];
  metadata: {
    startTime: string;
    endTime?: string;
    instance?: string;
  };
}

// ---------------------------------------------------------------------------
// Types — records.json
// ---------------------------------------------------------------------------

interface TrackedRecord {
  table: string;
  sys_id: string;
  number?: string;
  purpose: "test_data" | "deployed_artifact";
  created_at: string;
  contract?: string;
  scenario?: string;
}

interface RecordRegistry {
  records: TrackedRecord[];
}

// ---------------------------------------------------------------------------
// Types — deploy-snapshot.json
// ---------------------------------------------------------------------------

interface DeploySnapshotEntry {
  table: string;
  sys_id: string;
  name: string;
  type: string;
  action: "created" | "updated";
  original_values?: Record<string, string>;
  deployed_at: string;
}

interface DeploySnapshot {
  entries: DeploySnapshotEntry[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const RESULTS_DIR = join(process.cwd(), "test-results");
const RESULTS_PATH = join(RESULTS_DIR, "results.json");
const RECORDS_PATH = join(RESULTS_DIR, "records.json");
const SNAPSHOT_PATH = join(RESULTS_DIR, "deploy-snapshot.json");

function ensureResultsDir(): void {
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Load / save helpers
// ---------------------------------------------------------------------------

function loadResults(): ResultsManifest {
  if (!existsSync(RESULTS_PATH)) {
    return { suites: [], metadata: { startTime: new Date().toISOString() } };
  }
  return JSON.parse(readFileSync(RESULTS_PATH, "utf8")) as ResultsManifest;
}

function loadRecords(): RecordRegistry {
  if (!existsSync(RECORDS_PATH)) {
    return { records: [] };
  }
  return JSON.parse(readFileSync(RECORDS_PATH, "utf8")) as RecordRegistry;
}

function saveResults(manifest: ResultsManifest): void {
  ensureResultsDir();
  writeFileSync(RESULTS_PATH, JSON.stringify(manifest, null, 2));
}

function saveRecords(registry: RecordRegistry): void {
  ensureResultsDir();
  writeFileSync(RECORDS_PATH, JSON.stringify(registry, null, 2));
}

function loadSnapshot(): DeploySnapshot {
  if (!existsSync(SNAPSHOT_PATH)) {
    return { entries: [], created_at: new Date().toISOString() };
  }
  return JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as DeploySnapshot;
}

function saveSnapshot(snapshot: DeploySnapshot): void {
  ensureResultsDir();
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
}

function appendSnapshotEntry(entry: DeploySnapshotEntry): void {
  const snapshot = loadSnapshot();
  snapshot.entries.push(entry);
  saveSnapshot(snapshot);
}

function clearSnapshot(): void {
  saveSnapshot({ entries: [], created_at: new Date().toISOString() });
}

// ---------------------------------------------------------------------------
// Public API — results
// ---------------------------------------------------------------------------

interface AppendResultOpts {
  contract: string;
  scenario: string;
  passed: boolean;
  tags?: string[];
  error?: string;
  duration_ms?: number;
}

function appendResult(opts: AppendResultOpts): void {
  const manifest = loadResults();

  let suite = manifest.suites.find((s) => s.title === opts.contract);
  if (!suite) {
    suite = { title: opts.contract, specs: [] };
    manifest.suites.push(suite);
  }

  const spec: TestSpec = {
    title: opts.scenario,
    ok: opts.passed,
    tags: opts.tags,
    tests: [
      {
        results: [
          {
            status: opts.passed ? "passed" : "failed",
            duration: opts.duration_ms ?? 0,
            ...(opts.error ? { error: { message: opts.error } } : {}),
          },
        ],
      },
    ],
  };

  suite.specs.push(spec);
  manifest.metadata.endTime = new Date().toISOString();
  saveResults(manifest);
}

function clearResults(): void {
  saveResults({ suites: [], metadata: { startTime: new Date().toISOString() } });
}

// ---------------------------------------------------------------------------
// Public API — records
// ---------------------------------------------------------------------------

interface TrackRecordOpts {
  table: string;
  sys_id: string;
  number?: string;
  purpose: "test_data" | "deployed_artifact";
  contract?: string;
  scenario?: string;
}

function trackRecord(opts: TrackRecordOpts): void {
  const registry = loadRecords();
  registry.records.push({
    ...opts,
    created_at: new Date().toISOString(),
  });
  saveRecords(registry);
}

function getAllTrackedRecords(purpose?: string): TrackedRecord[] {
  const registry = loadRecords();
  if (purpose) {
    return registry.records.filter((r) => r.purpose === purpose);
  }
  return registry.records;
}

function clearRecords(): void {
  saveRecords({ records: [] });
}

// ---------------------------------------------------------------------------
// Public API — summary stats
// ---------------------------------------------------------------------------

interface SuiteStats {
  name: string;
  passed: number;
  failed: number;
}

interface SummaryStats {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  suites: SuiteStats[];
}

function getSummaryStats(): SummaryStats {
  const manifest = loadResults();
  let total = 0;
  let passed = 0;
  let failed = 0;
  const suites: SuiteStats[] = [];

  for (const suite of manifest.suites) {
    let sp = 0;
    let sf = 0;
    for (const spec of suite.specs) {
      total++;
      if (spec.ok) {
        passed++;
        sp++;
      } else {
        failed++;
        sf++;
      }
    }
    suites.push({ name: suite.title, passed: sp, failed: sf });
  }

  return {
    total,
    passed,
    failed,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    suites,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  appendResult,
  appendSnapshotEntry,
  clearRecords,
  clearResults,
  clearSnapshot,
  getAllTrackedRecords,
  getSummaryStats,
  loadRecords,
  loadResults,
  loadSnapshot,
  saveRecords,
  saveResults,
  saveSnapshot,
  trackRecord,
  DeploySnapshotEntry,
  DeploySnapshot,
  TrackedRecord,
  SummaryStats,
};
