import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "./auth";
import { api, useFetch, today } from "./api";
import { Table, Status, LoadError } from "./components";
import { Icon } from "./icons";

const HERO = "/images/dairy-hero.webp";
const roleOptions = [
  { name: "Farmer", icon: "cow", email: "farmer@demo.local" },
  { name: "Vet", icon: "stethoscope", email: "vet@demo.local" },
  { name: "Admin", icon: "shield", email: "admin@demo.local" },
];

// Unit 2: controlled forms, context and real role-based login.
export function Login() {
  const { user, login } = useAuth();
  const [register, setRegister] = useState(false);
  const [role, setRole] = useState("Farmer");
  const [values, setValues] = useState({
    email: "farmer@demo.local",
    password: "Demo123!",
    name: "",
    phone: "",
    village: "",
    address: "",
  });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/" replace />;

  function update(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = register
        ? values
        : { email: values.email, password: values.password };
      login(
        await api(
          "user",
          register ? "/auth/register/farmer" : "/auth/login",
          "POST",
          body,
        ),
      );
    } catch (exception) {
      setError(exception.message || "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <div className="auth-visual">
        <img
          className="auth-photo"
          src={HERO}
          alt="Dairy cows in a lush green pasture"
        />
        <div className="auth-image-shade" />
        <Link className="auth-brand" to="/login">
          <span className="brand-mark">
            <Icon name="leaf" />
          </span>
          <span className="brand-copy">
            Livestock<span>HEALTH & MILK SAFETY ERP</span>
          </span>
        </Link>
        <div className="auth-visual-copy">
          <span className="auth-eyebrow">
            <span className="live-dot" /> LIVESTOCK HEALTH & MILK SAFETY
          </span>
          <h1>
            Animal health.
            <br />
            Milk safety.
            <br />
            <em>Farm records.</em>
          </h1>
          <p>
            Register animals, book veterinary visits and keep track of which
            milk is safe to sell.
          </p>
        </div>
        <div className="auth-visual-bottom">
          <span>
            <Icon name="shield" /> Animals, treatments and milk records
          </span>
          <span>Full Stack Web Development</span>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-content">
          <div className="auth-header">
            <span className="eyebrow">LIVESTOCK ERP</span>
            <h2>{register ? "Register as a farmer" : "Sign in"}</h2>
            <p>
              {register
                ? "Enter your details to register your farm."
                : "Choose a demo account, or enter your own email and password."}
            </p>
          </div>
          {!register && (
            <div
              className="role-tabs"
              role="group"
              aria-label="Choose a demonstration account"
            >
              {roleOptions.map((option) => (
                <button
                  type="button"
                  className={role === option.name ? "selected" : ""}
                  aria-pressed={role === option.name}
                  key={option.name}
                  onClick={() => {
                    setRole(option.name);
                    setValues({
                      ...values,
                      email: option.email,
                      password: "Demo123!",
                    });
                    setError("");
                  }}
                >
                  <Icon name={option.icon} />
                  {option.name}
                </button>
              ))}
            </div>
          )}
          <form className="auth-form" onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  value={values.name}
                  onChange={update}
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={update}
                required
              />
            </label>
            <label>
              Password
              <span className="input-wrap">
                <input
                  type={visible ? "text" : "password"}
                  name="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  value={values.password}
                  onChange={update}
                  required
                  minLength={register ? 6 : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  <Icon name="eye" />
                </button>
              </span>
            </label>
            {register && (
              <div className="auth-register-grid">
                <label>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={update}
                    required
                  />
                </label>
                <label>
                  Village
                  <input
                    name="village"
                    value={values.village}
                    onChange={update}
                    required
                  />
                </label>
                <label className="full-width">
                  Address
                  <input
                    name="address"
                    autoComplete="street-address"
                    value={values.address}
                    onChange={update}
                    required
                  />
                </label>
              </div>
            )}
            {!register && (
              <p className="auth-security">
                <Icon name="shield" /> Your session is limited to this browser
                tab.
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="auth-submit" disabled={busy}>
              {busy
                ? "Signing in…"
                : register
                  ? "Create farmer account"
                  : "Sign in"}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create a farmer account"}
              <Icon name="arrow" />
            </button>
          </p>
          <div className="demo-note">
            <span className="demo-note-icon">
              <Icon name="leaf" />
            </span>
            <div>
              <strong>Demo accounts</strong>
              <p>
                {register
                  ? "Farmer signup connects your animals, visits and milk records."
                  : "Select Farmer, Vet or Admin above. Password: Demo123!"}
              </p>
            </div>
          </div>
        </div>
        <div className="auth-bottom">
          <span>21CSE354T · Academic project</span>
          <span>
            Runs on your local server <Icon name="sun" />
          </span>
        </div>
      </div>
    </section>
  );
}

function DashboardHeading({ name, label }) {
  return (
    <div className="dashboard-heading">
      <div>
        <span className="eyebrow">{label || "FARM OVERVIEW"}</span>
        <h1>
          Dashboard<span className="heading-dot">.</span>
        </h1>
        <p>Welcome back, {name}. Your current records are shown below.</p>
      </div>
      <div className="dashboard-date">
        <Icon name="calendar" />
        <span>
          {new Intl.DateTimeFormat("en", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date())}
        </span>
      </div>
    </div>
  );
}
function Hero({ title, description, to, action }) {
  return (
    <section className="dashboard-hero">
      <img src={HERO} alt="A peaceful dairy pasture" />
      <div className="hero-shade" />
      <div className="hero-copy">
        <span className="hero-eyebrow">
          <Icon name="leaf" /> LIVESTOCK MANAGEMENT
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        <Link className="hero-button" to={to}>
          {action}
          <Icon name="arrow" />
        </Link>
      </div>
      <span className="hero-tag">
        <Icon name="shield" /> Treatment-linked milk sale checks
      </span>
    </section>
  );
}
function Stat({ icon, label, value, detail, tone = "" }) {
  return (
    <article className={"stat-card " + tone}>
      <div className="stat-top">
        <span className="stat-icon">
          <Icon name={icon} />
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}
function QuickLinks({ links }) {
  return (
    <section className="dashboard-quick">
      <div className="section-heading">
        <h2>Quick actions</h2>
        <span className="eyebrow">QUICK ACTIONS</span>
      </div>
      <div className="quick-links">
        {links.map(([to, title, description, icon]) => (
          <Link className="quick-link" key={to} to={to}>
            <span className="quick-icon">
              <Icon name={icon} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <Icon name="arrow" />
          </Link>
        ))}
      </div>
    </section>
  );
}
function SafetyCard({ blocked = 0, error = false }) {
  return (
    <section className="safety-card">
      <span className="safety-icon">
        <Icon name="shield" />
      </span>
      <span className="eyebrow">WITHDRAWAL CHECK</span>
      <h3>
        Milk under
        <br />
        withdrawal
      </h3>
      <p>
        {error
          ? "Open milk records to check withdrawal status."
          : blocked
            ? blocked +
              " animal" +
              (blocked === 1 ? " is" : "s are") +
              " under withdrawal. Milk sales stay blocked until the safe date."
            : "Every milk sale is checked against recorded antibiotic withdrawal periods."}
      </p>
      <Link to="/milk">
        View milk records <Icon name="arrow" />
      </Link>
    </section>
  );
}
function Empty({ icon, title, children, to, action }) {
  return (
    <div className="dashboard-empty">
      <span>
        <Icon name={icon} />
      </span>
      <strong>{title}</strong>
      <p>{children}</p>
      {to && (
        <Link to={to}>
          {action}
          <Icon name="arrow" />
        </Link>
      )}
    </div>
  );
}
const value = (query, amount) => (query.loading || query.error ? "—" : amount);
const currentBlocks = (rows) =>
  rows.filter((x) => today() >= x.startDate && today() <= x.endDate);
const number = (amount) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(amount);

function FarmerDashboard({ user }) {
  const animals = useFetch("user", "/farmers/" + user.farmerId + "/animals");
  const bookings = useFetch("vet", "/bookings");
  const milk = useFetch("milk", "/milk-records");
  const withdrawals = useFetch("milk", "/withdrawal-blocks");
  const ownedBookings = bookings.data.filter(
    (x) => x.farmerId === user.farmerId,
  );
  const upcoming = ownedBookings.filter(
    (x) =>
      ["PENDING", "ACCEPTED"].includes(x.status) &&
      x.appointmentDate >= today(),
  );
  const blocks = currentBlocks(
    withdrawals.data.filter((x) => x.farmerId === user.farmerId),
  );
  const blockedIds = new Set(blocks.map((x) => x.animalId));
  const litres = milk.data
    .filter((x) => x.farmerId === user.farmerId && x.recordDate === today())
    .reduce((sum, x) => sum + Number(x.litres), 0);
  return (
    <div className="dashboard-page">
      <DashboardHeading name={user.name} />
      <Hero
        title={
          <>
            Animal records
            <br />
            and daily milk.
          </>
        }
        description="Manage your animals, arrange a vet visit and record milk yield. Milk sales are checked against recorded treatments."
        to="/animals"
        action="View my animals"
      />
      <div className="stats-grid">
        <Stat
          icon="cow"
          label="Registered animals"
          value={value(animals, animals.data.length)}
          detail="Animals registered to your account"
        />
        <Stat
          icon="milk"
          label="Milk recorded today"
          value={value(
            milk,
            <>
              {number(litres)}
              <small> L</small>
            </>,
          )}
          detail="Total yield entered for today"
          tone="cream"
        />
        <Stat
          icon="calendar"
          label="Upcoming visits"
          value={value(bookings, upcoming.length)}
          detail="Pending & accepted appointments"
          tone="peach"
        />
        <Stat
          icon="shield"
          label="Under withdrawal"
          value={value(withdrawals, blockedIds.size)}
          detail="Milk sales protected automatically"
          tone="sage"
        />
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-main">
          <section className="herd-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ANIMAL REGISTRY</span>
                <h2>My animals</h2>
              </div>
              <Link to="/animals">
                View all animals
                <Icon name="arrow" />
              </Link>
            </div>
            <LoadError query={animals} />
            {!animals.loading &&
              !animals.error &&
              (animals.data.length ? (
                <div className="animal-grid">
                  {animals.data.slice(0, 3).map((animal, index) => (
                    <Link
                      to="/animals"
                      className={"herd-card herd-card-" + (index % 3)}
                      key={animal.id}
                    >
                      <div className="herd-card-top">
                        <span className="herd-avatar">
                          <Icon name="cow" />
                        </span>
                        <Icon name="arrow" />
                      </div>
                      <div className="herd-info">
                        <h3>{animal.tagNumber}</h3>
                        <p>{animal.breed}</p>
                      </div>
                      <div className="herd-meta">
                        <span>{animal.age} years old</span>
                        <Status
                          value={
                            blockedIds.has(animal.id)
                              ? "UNDER WITHDRAWAL"
                              : animal.healthStatus
                          }
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty
                  icon="cow"
                  title="No animals registered"
                  to="/animals"
                  action="Register an animal"
                >
                  Add your herd to keep care and milk records together.
                </Empty>
              ))}
          </section>
          <section className="activity-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">BOOKINGS</span>
                <h2>Upcoming appointments</h2>
              </div>
              <Link to="/book">
                All bookings
                <Icon name="arrow" />
              </Link>
            </div>
            <LoadError query={bookings} />
            {!bookings.loading &&
              !bookings.error &&
              (upcoming.length ? (
                <Table
                  rows={upcoming.slice(0, 4)}
                  columns={[
                    [
                      "Service",
                      (x) => (
                        <div className="table-service">
                          <strong>{x.listing.title}</strong>
                          <small>{x.listing.vet.name}</small>
                        </div>
                      ),
                    ],
                    [
                      "Animal",
                      (x) =>
                        animals.data.find((a) => a.id === x.animalId)
                          ?.tagNumber || "#" + x.animalId,
                    ],
                    ["Date", "appointmentDate"],
                    ["Status", (x) => <Status value={x.status} />],
                  ]}
                />
              ) : (
                <Empty icon="calendar" title="No upcoming bookings">
                  No upcoming visits. You can book a vet whenever your herd
                  needs care.
                </Empty>
              ))}
          </section>
        </div>
        <aside className="dashboard-aside">
          <QuickLinks
            links={[
              [
                "/animals",
                "Register an animal",
                "Add an animal to your registry",
                "plus",
              ],
              [
                "/book",
                "Book a vet visit",
                "Choose a service and appointment date",
                "stethoscope",
              ],
              [
                "/milk",
                "Record today's milk",
                "Add daily yield or make a sale",
                "milk",
              ],
            ]}
          />
          <SafetyCard blocked={blockedIds.size} error={!!withdrawals.error} />
        </aside>
      </div>
    </div>
  );
}

function VetDashboard({ user }) {
  const bookings = useFetch("vet", "/bookings");
  const services = useFetch("vet", "/services");
  const treatments = useFetch("vet", "/treatments");
  const ownBookings = bookings.data.filter(
    (x) => x.listing.vet.userId === user.userId,
  );
  const ownServices = services.data.filter((x) => x.vet.userId === user.userId);
  const pending = ownBookings.filter((x) => x.status === "PENDING");
  const accepted = ownBookings.filter((x) => x.status === "ACCEPTED");
  const complete = treatments.data.filter(
    (x) =>
      x.booking.listing.vet.userId === user.userId && x.status === "COMPLETED",
  );
  return (
    <div className="dashboard-page">
      <DashboardHeading name={user.name} label="VET OVERVIEW" />
      <Hero
        title={
          <>
            Bookings
            <br />
            and treatments.
          </>
        }
        description="Review booking requests, update your services and record treatment or vaccination details."
        to="/bookings"
        action="View booking requests"
      />
      <div className="stats-grid">
        <Stat
          icon="calendar"
          label="Awaiting your response"
          value={value(bookings, pending.length)}
          detail="New booking requests"
        />
        <Stat
          icon="stethoscope"
          label="Accepted visits"
          value={value(bookings, accepted.length)}
          detail="Bookings you have accepted"
          tone="cream"
        />
        <Stat
          icon="heart"
          label="Treatments completed"
          value={value(treatments, complete.length)}
          detail="Recorded treatment workflows"
          tone="peach"
        />
        <Stat
          icon="leaf"
          label="Available services"
          value={value(services, ownServices.filter((x) => x.available).length)}
          detail="Care your farmers can book"
          tone="sage"
        />
      </div>
      <div className="dashboard-columns">
        <section className="activity-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">APPOINTMENTS</span>
              <h2>Recent bookings</h2>
            </div>
            <Link to="/bookings">
              View all
              <Icon name="arrow" />
            </Link>
          </div>
          <LoadError query={bookings} />
          {!bookings.loading &&
            !bookings.error &&
            (ownBookings.length ? (
              <Table
                rows={ownBookings.slice(-6).reverse()}
                columns={[
                  ["Service", (x) => x.listing.title],
                  ["Animal", "animalId"],
                  ["Date", "appointmentDate"],
                  ["Status", (x) => <Status value={x.status} />],
                ]}
              />
            ) : (
              <Empty icon="calendar" title="No bookings yet">
                Create a service so farmers can book an appointment with you.
              </Empty>
            ))}
        </section>
        <aside className="dashboard-aside">
          <QuickLinks
            links={[
              [
                "/services",
                "Manage your services",
                "Edit availability and create listings",
                "stethoscope",
              ],
              [
                "/treatment",
                "Record treatment",
                "Enter medicine, dose and withdrawal days",
                "heart",
              ],
              [
                "/history",
                "Review care history",
                "Review saved treatments and vaccinations",
                "clock",
              ],
            ]}
          />
          <section className="safety-card">
            <span className="safety-icon">
              <Icon name="shield" />
            </span>
            <span className="eyebrow">BUILT-IN MILK SAFETY</span>
            <h3>
              Treatment records
              <br />
              and milk safety.
            </h3>
            <p>
              Antibiotic treatments automatically create withdrawal blocks
              before medicine stock is deducted.
            </p>
            <Link to="/history">
              Review treatments
              <Icon name="arrow" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AdminDashboard({ user }) {
  const users = useFetch("user", "/users");
  const stock = useFetch("pharmacy", "/medicines");
  const bookings = useFetch("vet", "/bookings");
  const withdrawals = useFetch("milk", "/withdrawal-blocks");
  const lowStock = stock.data.filter((x) => x.stock < x.threshold);
  return (
    <div className="dashboard-page">
      <DashboardHeading name={user.name} label="ADMIN OVERVIEW" />
      <Hero
        title={
          <>
            Users, stock
            <br />
            and reports.
          </>
        }
        description="Manage accounts and inventory, check low-stock items and run the six database reports."
        to="/reports"
        action="Explore your reports"
      />
      <div className="stats-grid">
        <Stat
          icon="users"
          label="Registered users"
          value={value(users, users.data.length)}
          detail="Farmers, veterinarians & admins"
        />
        <Stat
          icon="box"
          label="Low-stock items"
          value={value(stock, lowStock.length)}
          detail="Below the inventory threshold"
          tone="cream"
        />
        <Stat
          icon="calendar"
          label="Pending bookings"
          value={value(
            bookings,
            bookings.data.filter((x) => x.status === "PENDING").length,
          )}
          detail="Waiting for a vet's response"
          tone="peach"
        />
        <Stat
          icon="shield"
          label="Animals under withdrawal"
          value={value(
            withdrawals,
            new Set(currentBlocks(withdrawals.data).map((x) => x.animalId))
              .size,
          )}
          detail="Milk sales protected"
          tone="sage"
        />
      </div>
      <div className="dashboard-columns">
        <section className="activity-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PHARMACY</span>
              <h2>Inventory that needs attention</h2>
            </div>
            <Link to="/stock">
              Manage stock
              <Icon name="arrow" />
            </Link>
          </div>
          <LoadError query={stock} />
          {!stock.loading &&
            !stock.error &&
            (lowStock.length ? (
              <Table
                rows={lowStock}
                columns={[
                  ["Item", "name"],
                  ["Category", "type"],
                  ["Stock", "stock"],
                  ["Threshold", "threshold"],
                  ["Status", () => <Status value="LOW STOCK" />],
                ]}
              />
            ) : (
              <Empty icon="check" title="All stocked up">
                No inventory items are below their configured thresholds.
              </Empty>
            ))}
        </section>
        <aside className="dashboard-aside">
          <QuickLinks
            links={[
              [
                "/users",
                "Manage people",
                "View users and create vet accounts",
                "users",
              ],
              [
                "/stock",
                "Update inventory",
                "Keep medicines and vaccines ready",
                "box",
              ],
              ["/reports", "Explore reports", "Run the SQL reports", "chart"],
            ]}
          />
          <section className="safety-card">
            <span className="safety-icon">
              <Icon name="chart" />
            </span>
            <span className="eyebrow">DATABASE REPORTS</span>
            <h3>
              Six reports.
              <br />
              Current data.
            </h3>
            <p>
              Explore six live reports connecting animal care, withdrawal
              periods, ratings and inventory.
            </p>
            <Link to="/reports">
              Open reports
              <Icon name="arrow" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  if (user.role === "FARMER") return <FarmerDashboard user={user} />;
  if (user.role === "VET") return <VetDashboard user={user} />;
  return <AdminDashboard user={user} />;
}
