import { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface Record {
  id: string;
  name: string;
  type: "checkin" | "checkout";
  image_url: string | null;
  timestamp: string;
}

export default function Admin() {
  const [authed, setAuthed] = useState(
    () => !!localStorage.getItem("adminToken"),
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  useEffect(() => {
    if (authed) fetchRecords();
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await api.adminLogin(username, password);
      localStorage.setItem("adminToken", data.token);
      setAuthed(true);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setLoginLoading(false);
    }
  }

  async function fetchRecords() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getRecords();
      setRecords(data.records);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("403")) {
        handleLogout();
      }
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await api.downloadSheet();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    setAuthed(false);
    setRecords([]);
  }

  const checkins = records.filter((r) => r.type === "checkin").length;
  const checkouts = records.filter((r) => r.type === "checkout").length;

  if (!authed) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-mono text-2xl font-bold text-white">
              ADMIN<span className="text-accent">_</span>ACCESS
            </h1>
            <p className="font-mono text-xs text-muted mt-2 tracking-wider">
              RESTRICTED AREA
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted block mb-2 tracking-wider">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-accent transition-colors"
                  placeholder="admin"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted block mb-2 tracking-wider">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 pr-12 font-mono text-sm text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {loginError && (
                <p className="font-mono text-xs text-warn bg-warn/10 border border-warn/20 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-lg font-mono text-sm font-bold bg-accent text-ink hover:bg-accent-dim transition-colors disabled:opacity-50"
              >
                {loginLoading ? "VERIFYING..." : "ENTER ADMIN →"}
              </button>
            </form>
            <Link
              to="/"
              className="block text-center font-mono text-xs text-muted hover:text-white transition-colors mt-4"
            >
              ← Back to Terminal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg p-4 md:p-8">
      {/* Image Modal */}
      {selectedImg && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt="capture"
            className="max-w-sm max-h-96 rounded-xl object-cover"
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-mono text-2xl font-bold text-white">
              ADMIN<span className="text-accent">_</span>DASHBOARD
            </h1>
            <p className="font-mono text-xs text-muted mt-1">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-mono text-xs border border-border text-muted hover:text-white hover:border-accent transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "↻ Refresh"}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 rounded-lg font-mono text-xs bg-accent text-ink font-bold hover:bg-accent-dim transition-colors disabled:opacity-50"
            >
              {downloading ? "GENERATING..." : "⬇ Download Sheet"}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg font-mono text-xs border border-warn/30 text-warn/70 hover:text-warn hover:border-warn transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Records"
            value={records.length}
            color="text-white"
          />
          <StatCard label="Check Ins" value={checkins} color="text-accent" />
          <StatCard label="Check Outs" value={checkouts} color="text-warn" />
        </div>

        {/* Note */}
        <div className="mb-4 flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-lg px-4 py-2">
          <span className="text-accent text-xs font-mono">ℹ</span>
          <p className="font-mono text-xs text-muted">
            Showing records from the last 48 hours. Download the sheet daily —
            records are auto-deleted after 48h.
          </p>
        </div>

        {/* Records Table */}
        {error && (
          <div className="bg-warn/10 border border-warn/20 rounded-lg px-4 py-3 mb-4">
            <p className="font-mono text-xs text-warn">{error}</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="font-mono text-xs text-muted">LOADING RECORDS</p>
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-mono text-sm text-muted">
                  No records in the last 48 hours
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-mono text-xs text-muted tracking-wider px-6 py-4">
                      EMPLOYEE
                    </th>
                    <th className="text-left font-mono text-xs text-muted tracking-wider px-6 py-4">
                      ACTION
                    </th>
                    <th className="text-left font-mono text-xs text-muted tracking-wider px-6 py-4">
                      TIME
                    </th>
                    <th className="text-left font-mono text-xs text-muted tracking-wider px-6 py-4">
                      DATE
                    </th>
                    <th className="text-left font-mono text-xs text-muted tracking-wider px-6 py-4">
                      PHOTO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const ts = new Date(r.timestamp);
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-border/50 hover:bg-surface/50 transition-colors ${i % 2 === 0 ? "" : "bg-surface/20"}`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-sans text-sm text-white font-medium">
                            {r.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold ${
                              r.type === "checkin"
                                ? "bg-accent/15 text-accent"
                                : "bg-warn/15 text-warn"
                            }`}
                          >
                            {r.type === "checkin"
                              ? "🟢 Check In"
                              : "🔴 Check Out"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-white tabular-nums">
                            {ts.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-muted">
                            {ts.toLocaleDateString("en-GB")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {r.image_url ? (
                            <button
                              onClick={() => setSelectedImg(r.image_url)}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
                            >
                              <img
                                src={r.image_url}
                                alt="cap"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <span className="font-mono text-xs text-muted/40">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl px-6 py-5">
      <p className="font-mono text-xs text-muted tracking-wider mb-2">
        {label.toUpperCase()}
      </p>
      <p className={`font-mono text-3xl font-bold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}
