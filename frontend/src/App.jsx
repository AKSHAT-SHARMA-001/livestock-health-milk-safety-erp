import React, { useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth, Protected } from "./auth";
import { Login, Dashboard } from "./VisualPages";
import {
  Animals,
  Vets,
  Book,
  History,
  Milk,
  Services,
  Bookings,
  Treatment,
  Stock,
  Reports,
  Users,
} from "./pages";
import { Icon } from "./icons";

const navigation = {
  FARMER: [
    ["/animals", "My animals", "cow"],
    ["/vets", "Find a veterinarian", "stethoscope"],
    ["/book", "Appointments", "calendar"],
    ["/history", "Health records", "heart"],
    ["/milk", "Milk & sales", "milk"],
  ],
  VET: [
    ["/services", "My services", "stethoscope"],
    ["/bookings", "Booking requests", "calendar"],
    ["/treatment", "Record treatment", "plus"],
    ["/history", "Health records", "heart"],
  ],
  ADMIN: [
    ["/users", "People & accounts", "users"],
    ["/stock", "Pharmacy inventory", "box"],
    ["/reports", "Reports & insights", "chart"],
  ],
};
function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <Icon name="leaf" size={23} />
      </span>
      <span className="brand-copy">
        Livestock<span>HEALTH & MILK SAFETY</span>
      </span>
    </Link>
  );
}
function WorkspaceShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation(),
    navigate = useNavigate();
  const [query, setQuery] = useState(""),
    [menu, setMenu] = useState(false);
  const links = [["/", "Overview", "grid"], ...(navigation[user.role] || [])];
  const current =
    links.find(([path]) => path === location.pathname)?.[1] || "Workspace";
  const matches = links.filter(([, title]) =>
    title.toLowerCase().includes(query.toLowerCase()),
  );
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
  function leave() {
    logout();
    navigate("/login");
  }
  return (
    <div className="workspace">
      <aside className={"sidebar " + (menu ? "mobile-open" : "")}>
        <Brand />
        <div className="workspace-label">
          <span className="tiny-dot" />
          {user.role[0] + user.role.slice(1).toLowerCase()} workspace
        </div>
        <div className="nav-caption">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation" className="side-nav">
          {links.map(([path, title, icon]) => (
            <NavLink
              key={path}
              end={path === "/"}
              to={path}
              onClick={() => setMenu(false)}
            >
              <Icon name={icon} />
              <span>{title}</span>
              <Icon name="chevron" size={14} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="sidebar-note-icon">
              <Icon name="shield" size={25} />
            </span>
            <strong>Milk sale checks</strong>
            <p>Antibiotic withdrawal periods are checked before each sale.</p>
          </div>
          <button
            className="user-menu"
            onClick={leave}
            title="Sign out"
            aria-label="Sign out"
          >
            <span className="avatar">{initials}</span>
            <span className="user-copy">
              <strong>{user.name}</strong>
              <small>{user.role.toLowerCase()} account</small>
            </span>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace-body">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMenu(!menu)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <Icon name="chevron" size={13} />
            <strong>{current}</strong>
          </div>
          <div className="topbar-right">
            <div className="workspace-search">
              <Icon name="search" size={17} />
              <input
                aria-label="Find a page"
                placeholder="Find a page…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                  if (e.key === "Enter" && matches.length) {
                    navigate(matches[0][0]);
                    setQuery("");
                  }
                }}
              />
              {query && (
                <div className="search-results">
                  {matches.length ? (
                    matches.map(([path, title, icon]) => (
                      <Link to={path} key={path} onClick={() => setQuery("")}>
                        <Icon name={icon} size={17} />
                        {title}
                        <Icon name="arrow" size={14} />
                      </Link>
                    ))
                  ) : (
                    <p>No pages found</p>
                  )}
                </div>
              )}
            </div>
            <span className="local-status">
              <span className="tiny-dot" />
              Local workspace
            </span>
            <span className="avatar top-avatar">{initials}</span>
          </div>
        </header>
        <main className="app-main" key={location.pathname}>
          {children}
        </main>
        <footer className="app-footer">
          <span>Livestock Health & Milk Safety ERP</span>
          <span>Livestock ERP · 21CSE354T</span>
        </footer>
      </div>
    </div>
  );
}
export default function App() {
  const { user } = useAuth();
  const p = (roles, node) => <Protected roles={roles}>{node}</Protected>;
  const routes = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={p(["FARMER", "VET", "ADMIN"], <Dashboard />)} />
      <Route path="/animals" element={p(["FARMER"], <Animals />)} />
      <Route path="/vets" element={p(["FARMER"], <Vets />)} />
      <Route path="/book" element={p(["FARMER"], <Book />)} />
      <Route path="/history" element={p(["FARMER", "VET"], <History />)} />
      <Route path="/milk" element={p(["FARMER"], <Milk />)} />
      <Route path="/services" element={p(["VET"], <Services />)} />
      <Route path="/bookings" element={p(["VET"], <Bookings />)} />
      <Route path="/treatment" element={p(["VET"], <Treatment />)} />
      <Route path="/stock" element={p(["ADMIN"], <Stock />)} />
      <Route path="/reports" element={p(["ADMIN"], <Reports />)} />
      <Route path="/users" element={p(["ADMIN"], <Users />)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
  return user ? <WorkspaceShell>{routes}</WorkspaceShell> : routes;
}
