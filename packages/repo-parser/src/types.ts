import type { FileEntry } from "@axis/snapshots";

export interface LanguageStats {
  name: string;
  file_count: number;
  loc: number;
  loc_percent: number;
}

export interface FrameworkDetection {
  name: string;
  version: string | null;
  confidence: number;
  evidence: string[];
}

export interface FileAnnotation {
  path: string;
  type: "file" | "directory";
  language: string | null;
  loc: number;
  role: "source" | "test" | "config" | "documentation" | "build" | "asset" | "generated" | "unknown";
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: "production" | "development" | "peer" | "optional";
}

export interface ImportEdge {
  source: string;
  target: string;
}

export interface ParseResult {
  languages: LanguageStats[];
  frameworks: FrameworkDetection[];
  build_tools: string[];
  test_frameworks: string[];
  package_managers: string[];
  ci_platform: string | null;
  deployment_target: string | null;
  file_annotations: FileAnnotation[];
  dependencies: DependencyInfo[];
  internal_imports: ImportEdge[];
  top_level_dirs: { name: string; purpose: string; file_count: number }[];
  health: {
    has_readme: boolean;
    has_tests: boolean;
    test_file_count: number;
    has_ci: boolean;
    has_lockfile: boolean;
    has_typescript: boolean;
    has_linter: boolean;
    has_formatter: boolean;
  };
}
