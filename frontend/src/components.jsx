import React, { useState } from "react";
import { api } from "./api";
export function Table({ rows, columns, actions }) {
  if (!rows?.length) return <p className="empty">No records yet.</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map(([title]) => (
              <th key={title}>{title}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {columns.map(([title, get]) => (
                <td key={title}>
                  {typeof get === "function" ? get(r) : String(r[get] ?? "—")}
                </td>
              ))}
              {actions && <td className="actions">{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Form({ title, fields, onSubmit, submit = "Save" }) {
  const [values, setValues] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState("");
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setDone("");
        try {
          const body = {};
          fields.forEach((f) => {
            let v = values[f.name] ?? f.value ?? "";
            body[f.name] =
              f.type === "number" ? Number(v) : f.type === "checkbox" ? !!v : v;
          });
          await onSubmit(body);
          setDone("Saved successfully.");
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{title}</h2>
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.name}>
            {f.label || f.name}
            {f.options ? (
              <select
                required
                value={values[f.name] ?? f.value ?? ""}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.value })
                }
              >
                <option value="">Select…</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                required={f.required !== false && f.type !== "checkbox"}
                min={f.min}
                max={f.max}
                step={f.step}
                value={
                  f.type === "checkbox"
                    ? undefined
                    : (values[f.name] ?? f.value ?? "")
                }
                checked={
                  f.type === "checkbox"
                    ? !!(values[f.name] ?? f.value)
                    : undefined
                }
                onChange={(e) =>
                  setValues({
                    ...values,
                    [f.name]:
                      f.type === "checkbox" ? e.target.checked : e.target.value,
                  })
                }
              />
            )}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="success">
          {done}
        </p>
      )}
      <button disabled={busy}>{busy ? "Saving…" : submit}</button>
    </form>
  );
}
export function Page({ title, children }) {
  return (
    <>
      <h1>{title}</h1>
      {children}
    </>
  );
}
export function Status({ value }) {
  return (
    <span
      className={
        "badge " + (value === "COMPLETED" || value === "HEALTHY" ? "good" : "")
      }
    >
      {value}
    </span>
  );
}
export function LoadError({ query }) {
  return query.loading ? (
    <p>Loading…</p>
  ) : query.error ? (
    <p className="error" role="alert">
      {query.error} <button onClick={query.refresh}>Retry</button>
    </p>
  ) : null;
}
export function Action({
  service,
  path,
  method = "POST",
  body,
  label,
  onDone,
}) {
  const [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <button
        disabled={busy}
        onClick={async () => {
          if (method === "DELETE" && !window.confirm("Delete this record? This cannot be undone.")) return;
          setBusy(true);
          setErr("");
          try {
            await api(service, path, method, body);
            onDone?.();
          } catch (e) {
            setErr(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {label}
      </button>
      {err && <span className="error">{err}</span>}
    </>
  );
}
