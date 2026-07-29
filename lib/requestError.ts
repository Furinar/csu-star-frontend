import axios from "axios";

export type AsyncEmptyType = "empty" | "network-error" | "fail";

const NETWORK_HINTS = [
  "请求超时",
  "网络连接失败",
  "网络可能不稳定",
  "timeout",
  "network",
  "ECONNABORTED",
  "Failed to fetch",
  "Network Error",
];

export function isNetworkOrTimeoutError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      const message = error.message || "";
      return (
        /timeout/i.test(message) ||
        /network/i.test(message) ||
        /failed to fetch/i.test(message)
      );
    }
    return false;
  }

  if (error.code === "ECONNABORTED" || /timeout/i.test(error.message || "")) {
    return true;
  }

  return !error.response;
}

export function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (
      error.code === "ECONNABORTED" ||
      /timeout/i.test(error.message || "")
    ) {
      return "请求超时，网络可能不稳定，请稍后重试。";
    }

    if (!error.response) {
      return "网络连接失败，请检查网络后重试。";
    }

    const payload = error.response.data;
    if (typeof payload === "object" && payload !== null) {
      const code = "code" in payload ? payload.code : undefined;
      const msg =
        "msg" in payload && typeof payload.msg === "string"
          ? payload.msg
          : "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "";

      if (code === 10001) return "积分不足。";
      if (code === 10002) return "请勿重复操作。";
      if (code === 40001) return "请先登录或重新登录。";
      if (code === 40003) return "你当前没有权限执行此操作。";
      if (code === 40004) return "资源不存在或已被删除。";
      if (code === 40005) return "当前账号已被封禁。";

      if (msg.trim()) {
        return msg;
      }
    }

    if (typeof error.response.status === "number") {
      if (error.response.status === 401) return "请先登录或重新登录。";
      if (error.response.status === 403) return "你当前没有权限执行此操作。";
      if (error.response.status === 404) return "请求的资源不存在。";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    // Avoid leaking raw axios timeout English strings into UI.
    if (
      /timeout/i.test(error.message) ||
      /network error/i.test(error.message) ||
      /failed to fetch/i.test(error.message)
    ) {
      return isNetworkOrTimeoutError(error)
        ? "网络连接失败，请检查网络后重试。"
        : fallback;
    }
    return error.message;
  }

  return fallback;
}

/** Infer Empty type from a thrown error or an already-resolved message. */
export function resolveAsyncEmptyType(
  source: unknown,
  explicit?: AsyncEmptyType,
): AsyncEmptyType {
  if (explicit) return explicit;

  if (typeof source === "string") {
    const lower = source.toLowerCase();
    if (NETWORK_HINTS.some((hint) => lower.includes(hint.toLowerCase()))) {
      return "network-error";
    }
    return "fail";
  }

  return isNetworkOrTimeoutError(source) ? "network-error" : "fail";
}
