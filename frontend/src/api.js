import { useState, useEffect, useCallback } from "react";
const urls = {
  user: import.meta.env.VITE_USER_URL || "http://localhost:8081",
  vet: import.meta.env.VITE_VET_URL || "http://localhost:8082",
  pharmacy: import.meta.env.VITE_PHARMACY_URL || "http://localhost:8083",
  milk: import.meta.env.VITE_MILK_URL || "http://localhost:8084",
};
// Same-origin development proxy lets a temporary HTTPS demo reach all four APIs.
if (import.meta.env.DEV) {
  for (const service of Object.keys(urls))
    urls[service] = "/backend/" + service;
}
export async function api(service, path, method = "GET", body) {
  let token;
  try {
    token = JSON.parse(sessionStorage.getItem("erpUser"))?.token;
  } catch {}
  let r;
  try {
    r = await fetch(urls[service] + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw Error(
      error.name === "TimeoutError"
        ? "The server took too long to respond. Please try again."
        : "Could not reach the server. Check that the local ERP is running.",
    );
  }
  if (r.status === 401 && !path.startsWith("/auth/")) {
    window.dispatchEvent(new Event("erp-session-expired"));
    throw Error("Your session has expired. Please sign in again.");
  }
  if (!r.ok) {
    let d;
    try {
      d = await r.json();
    } catch {
      d = { message: r.statusText };
    }
    throw Error(
      Array.isArray(d.message)
        ? d.message.join(", ")
        : d.message || "Request failed",
    );
  }
  return r.status === 204 ? null : r.json();
}
// Unit 2: custom hook shares loading, errors and refreshing across all data pages.
export function useFetch(service, path) {
  const [data, setData] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(service, path));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [service, path]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, error, loading, refresh };
}
export const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
