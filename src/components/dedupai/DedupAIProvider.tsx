import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  analyzeFile as requestAnalysis,
  getAnalytics,
  getDuplicateGroups,
  getFile as getFileRequest,
  getFiles,
  healthCheck,
  toDedupAnalytics,
  toDemoFile,
  toDuplicateGroups,
  toUploadDemoFile,
  uploadFile as uploadFileRequest,
  type ApiFile,
  type ApiFileResult,
} from "@/services/api";
import type { DedupAnalytics } from "@/services/api";
import type { DemoFile, DuplicateGroup } from "@/types/dedupai";

type BackendStatus = "checking" | "online" | "offline";

interface DedupAIContextValue {
  files: DemoFile[];
  apiFiles: ApiFile[];
  duplicateGroups: DuplicateGroup[];
  analytics: DedupAnalytics | null;
  backendStatus: BackendStatus;
  isLoading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  uploadFile: (file: File) => Promise<ApiFileResult>;
  getFile: (fileId: string) => Promise<DemoFile>;
  analyzeFile: (fileId: string) => Promise<ApiFileResult>;
}

const DedupAIContext = createContext<DedupAIContextValue | null>(null);

export function DedupAIProvider({ children }: { children: ReactNode }) {
  const [apiFiles, setApiFiles] = useState<ApiFile[]>([]);
  const apiFilesRef = useRef(apiFiles);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [analytics, setAnalytics] = useState<DedupAnalytics | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    const [healthResult, filesResult, groupsResult, analyticsResult] = await Promise.allSettled([
      healthCheck(),
      getFiles(),
      getDuplicateGroups(),
      getAnalytics(),
    ]);

    const errors: string[] = [];
    if (healthResult.status === "fulfilled" && healthResult.value.status === "ok") {
      setBackendStatus("online");
    } else {
      setBackendStatus("offline");
      errors.push(
        healthResult.status === "rejected"
          ? errorMessage(healthResult.reason)
          : "Backend health check failed.",
      );
    }

    let currentFiles = apiFilesRef.current;
    if (filesResult.status === "fulfilled") {
      currentFiles = filesResult.value;
      apiFilesRef.current = currentFiles;
      setApiFiles(currentFiles);
    } else {
      errors.push(errorMessage(filesResult.reason));
    }

    if (groupsResult.status === "fulfilled") {
      setDuplicateGroups(toDuplicateGroups(groupsResult.value, currentFiles));
    } else {
      errors.push(errorMessage(groupsResult.reason));
    }

    if (analyticsResult.status === "fulfilled") {
      setAnalytics(toDedupAnalytics(analyticsResult.value));
    } else {
      errors.push(errorMessage(analyticsResult.reason));
    }

    setError(errors.length ? [...new Set(errors)].join(" ") : null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const uploadFile = useCallback(
    async (file: File) => {
      const result = await uploadFileRequest(file);
      await refreshAll();
      return result;
    },
    [refreshAll],
  );

  const getFile = useCallback(
    async (fileId: string) => {
      const result = await getFileRequest(fileId);
      return toDemoFile(result, apiFiles);
    },
    [apiFiles],
  );

  const analyzeFile = useCallback(
    async (fileId: string) => {
      const result = await requestAnalysis(fileId);
      await refreshAll();
      return result;
    },
    [refreshAll],
  );

  const files = useMemo(() => apiFiles.map((file) => toDemoFile(file, apiFiles)), [apiFiles]);
  const value = useMemo(
    () => ({
      files,
      apiFiles,
      duplicateGroups,
      analytics,
      backendStatus,
      isLoading,
      error,
      refreshAll,
      uploadFile,
      getFile,
      analyzeFile,
    }),
    [
      files,
      apiFiles,
      duplicateGroups,
      analytics,
      backendStatus,
      isLoading,
      error,
      refreshAll,
      uploadFile,
      getFile,
      analyzeFile,
    ],
  );

  return <DedupAIContext.Provider value={value}>{children}</DedupAIContext.Provider>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

export function useDedupAI() {
  const context = useContext(DedupAIContext);
  if (!context) throw new Error("useDedupAI must be used inside DedupAIProvider");
  return context;
}
