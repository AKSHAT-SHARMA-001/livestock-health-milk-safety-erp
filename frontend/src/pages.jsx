import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import VetDirectory from "./VetDirectory";
import { publicListings } from "./catalogue";
import { useAuth } from "./auth";
import { api, useFetch, today } from "./api";
import { Form, Table, Page, Status, LoadError, Action } from "./components";
const n = (name, label, value, min = 1) => ({
  name,
  label,
  type: "number",
  value,
  min,
});
const text = (name, label, value) => ({ name, label, value });
const date = (name, label) => ({ name, label, type: "date", value: today() });
const opts = (name, label, rows, caption) => ({
  name,
  label,
  options: rows.map((x) => ({ value: x.id, label: caption(x) })),
});
const animalCols = [
  ["ID", "id"],
  ["Tag", "tagNumber"],
  ["Breed", "breed"],
  ["Age (years)", "age"],
  ["Health", (r) => <Status value={r.healthStatus} />],
];
const bookingCols = [
  ["ID", "id"],
  ["Animal", "animalId"],
  ["Farmer", "farmerId"],
  ["Service", (r) => r.listing.title],
  ["Date", "appointmentDate"],
  ["Fee", "fee"],
  ["Status", (r) => <Status value={r.status} />],
];
export function Animals() {
  const { user } = useAuth();
  const q = useFetch("user", "/farmers/" + user.farmerId + "/animals");
  const [edit, setEdit] = useState(null);
  return (
    <Page title="My Animals">
      <LoadError query={q} />
      <Table
        rows={q.data}
        columns={animalCols}
        actions={(r) => (
          <>
            <button onClick={() => setEdit(r)}>Edit</button>
            <Action
              service="user"
              path={"/animals/" + r.id}
              method="DELETE"
              label="Delete"
              onDone={q.refresh}
            />
          </>
        )}
      />
      <Form
        key={edit?.id || "new"}
        title={edit ? "Edit animal #" + edit.id : "Register animal"}
        fields={[
          text("tagNumber", "Tag number", edit?.tagNumber),
          text("breed", "Breed", edit?.breed),
          n("age", "Age in years", edit?.age ?? 2, 0),
          text(
            "healthStatus",
            "Health status",
            edit?.healthStatus || "HEALTHY",
          ),
        ]}
        onSubmit={async (r) => {
          await api(
            "user",
            edit
              ? "/animals/" + edit.id
              : "/farmers/" + user.farmerId + "/animals",
            edit ? "PUT" : "POST",
            r,
          );
          setEdit(null);
          q.refresh();
        }}
      />
      {edit && <button onClick={() => setEdit(null)}>Cancel editing</button>}
    </Page>
  );
}
export function Vets() {
  return <VetDirectory />;
}
export function Book() {
  const { user } = useAuth(),
    a = useFetch("user", "/farmers/" + user.farmerId + "/animals"),
    s = useFetch("vet", "/services"),
    b = useFetch("vet", "/bookings");
  const [params] = useSearchParams();
  const requested = params.get("service") || "";
  const selected = s.data.find(
    (x) => String(x.id) === requested && x.available,
  );
  const choices = publicListings(s.data).filter((x) => x.available);
  if (selected && !choices.some((x) => x.id === selected.id))
    choices.push(selected);
  const rows = b.data.filter((x) => x.farmerId === user.farmerId);
  return (
    <Page title="Book Service">
      <LoadError query={b} />
      <LoadError query={s} />
      <LoadError query={a} />
      {requested && !s.loading && !s.error && !selected && (
        <p role="alert" className="notice">
          The selected service is unavailable. Choose another service below.
        </p>
      )}
      <Form
        key={selected?.id || "new"}
        title="New booking"
        submit="Book appointment"
        fields={[
          {
            ...opts(
              "listingId",
              "Service",
              choices.filter((x) => x.available),
              (x) => x.vet.name + " · " + x.title + " · ₹" + x.price,
            ),
            value: selected ? String(selected.id) : "",
          },
          opts("animalId", "Animal", a.data, (x) => x.tagNumber),
          date("appointmentDate", "Appointment date"),
        ]}
        onSubmit={async (r) => {
          await api("vet", "/bookings", "POST", {
            ...r,
            listingId: Number(r.listingId),
            animalId: Number(r.animalId),
            farmerId: user.farmerId,
          });
          b.refresh();
        }}
      />
      <Table rows={rows} columns={bookingCols} />
      <Form
        title="Rate a completed visit"
        fields={[
          opts(
            "bookingId",
            "Completed booking",
            rows.filter((x) => x.status === "COMPLETED"),
            (x) => "#" + x.id + " " + x.listing.title,
          ),
          { ...n("score", "Rating (1–5)", 5), max: 5 },
          text("comment", "Comment"),
        ]}
        onSubmit={(r) =>
          api("vet", "/ratings", "POST", {
            ...r,
            bookingId: Number(r.bookingId),
          })
        }
      />
    </Page>
  );
}
export function History() {
  const { user } = useAuth(),
    t = useFetch("vet", "/treatments"),
    v = useFetch("vet", "/vaccinations");
  const visible = (x) =>
    user.role === "FARMER"
      ? x.booking.farmerId === user.farmerId
      : x.booking.listing.vet.userId === user.userId;
  return (
    <Page title="Treatment History">
      <LoadError query={t} />
      <h2>Treatments</h2>
      <Table
        rows={t.data.filter(visible)}
        columns={[
          ["ID", "id"],
          ["Animal", (r) => r.booking.animalId],
          ["Medicine", "medicine"],
          ["Dose", "dose"],
          ["Date", "treatmentDate"],
          ["Withdrawal end", "endDate"],
          ["Status", (r) => <Status value={r.status} />],
        ]}
        actions={
          user.role === "VET"
            ? (r) =>
                r.status !== "COMPLETED" && (
                  <Action
                    service="vet"
                    path={"/treatments/" + r.id + "/retry"}
                    label="Retry workflow"
                    onDone={t.refresh}
                  />
                )
            : undefined
        }
      />
      <h2>Vaccinations</h2>
      <Table
        rows={v.data.filter(visible)}
        columns={[
          ["ID", "id"],
          ["Animal", (r) => r.booking.animalId],
          ["Vaccine", "vaccine"],
          ["Dose", "dose"],
          ["Date", "vaccinationDate"],
          ["Stock deducted", (r) => String(r.stockDeducted)],
        ]}
        actions={
          user.role === "VET"
            ? (r) =>
                !r.stockDeducted && (
                  <Action
                    service="vet"
                    path={"/vaccinations/" + r.id + "/retry"}
                    label="Retry"
                    onDone={v.refresh}
                  />
                )
            : undefined
        }
      />
    </Page>
  );
}
export function Milk() {
  const { user } = useAuth(),
    a = useFetch("user", "/farmers/" + user.farmerId + "/animals"),
    r = useFetch("milk", "/milk-records"),
    s = useFetch("milk", "/milk-sales"),
    w = useFetch("milk", "/withdrawal-blocks");
  const mine = (x) => x.farmerId === user.farmerId;
  const [eligibility, setEligibility] = useState(null);
  return (
    <Page title="Milk Records and Sales">
      <LoadError query={w} />
      <p className="notice">
        Sales are blocked throughout withdrawal. Discard milk collected during
        withdrawal; it cannot be sold after the block expires.
      </p>
      <Table
        rows={w.data.filter(mine)}
        columns={[
          ["Animal", "animalId"],
          ["Medicine", "medicine"],
          ["Start", "startDate"],
          ["End (inclusive)", "endDate"],
          [
            "Status",
            (x) => (
              <Status
                value={
                  today() >= x.startDate && today() <= x.endDate
                    ? "BLOCKED"
                    : "EXPIRED"
                }
              />
            ),
          ],
        ]}
      />
      <div className="cards">
        <Form
          title="Record daily yield"
          fields={[
            opts("animalId", "Animal", a.data, (x) => x.tagNumber),
            date("recordDate", "Record date"),
            { ...n("litres", "Litres", 5, 0.001), step: "0.001" },
          ]}
          onSubmit={async (x) => {
            await api("milk", "/milk-records", "POST", {
              ...x,
              animalId: Number(x.animalId),
              farmerId: user.farmerId,
            });
            r.refresh();
          }}
        />
        <Form
          title="Sell milk"
          submit="Check and sell"
          fields={[
            opts("animalId", "Animal", a.data, (x) => x.tagNumber),
            { ...n("litres", "Litres", 2, 0.001), step: "0.001" },
            {
              ...n("pricePerLitre", "Price per litre (₹)", 40, 0.01),
              step: "0.01",
            },
          ]}
          onSubmit={async (x) => {
            await api("milk", "/milk-sales", "POST", {
              ...x,
              animalId: Number(x.animalId),
              farmerId: user.farmerId,
            });
            s.refresh();
          }}
        />
        <Form
          title="Check withdrawal"
          fields={[opts("animalId", "Animal", a.data, (x) => x.tagNumber)]}
          submit="Check"
          onSubmit={async (x) =>
            setEligibility(
              await api("milk", "/animals/" + x.animalId + "/eligibility"),
            )
          }
        />
      </div>
      {eligibility && (
        <p className={eligibility.allowed ? "success" : "error"}>
          {eligibility.allowed
            ? "Safe to sell recorded safe milk"
            : eligibility.remainingDays +
              " withdrawal day(s) remaining through " +
              eligibility.endDate}
        </p>
      )}
      <h2>Yield records</h2>
      <Table
        rows={r.data.filter(mine)}
        columns={[
          ["Animal", "animalId"],
          ["Date", "recordDate"],
          ["Litres", "litres"],
        ]}
      />
      <h2>Sales</h2>
      <Table
        rows={s.data.filter(mine)}
        columns={[
          ["Animal", "animalId"],
          ["Date", "saleDate"],
          ["Litres", "litres"],
          ["₹ / litre", "pricePerLitre"],
        ]}
      />
    </Page>
  );
}
export function Services() {
  const { user } = useAuth(),
    v = useFetch("vet", "/vets"),
    s = useFetch("vet", "/services");
  const own = v.data.find((x) => x.userId === user.userId);
  return (
    <Page title="Manage Services">
      <LoadError query={v} />
      {!own ? (
        <Form
          title="Create vet profile"
          fields={[
            text("name", "Name", user.name),
            text("specialization", "Specialization"),
            text("phone", "Phone"),
          ]}
          onSubmit={async (r) => {
            await api("vet", "/vets", "POST", { ...r, userId: user.userId });
            v.refresh();
          }}
        />
      ) : (
        <>
          <p>
            Vet profile #{own.id} · {own.name}
          </p>
          <Form
            title="Create service listing"
            fields={[
              text("title", "Service title"),
              { ...n("price", "Fee (₹)", 500, 0.01), step: "0.01" },
              {
                name: "available",
                label: "Available",
                type: "checkbox",
                value: true,
              },
            ]}
            onSubmit={async (r) => {
              await api("vet", "/services", "POST", { ...r, vetId: own.id });
              s.refresh();
            }}
          />
          <Table
            rows={s.data.filter((x) => x.vet.id === own.id)}
            columns={[
              ["ID", "id"],
              ["Title", "title"],
              ["Price", "price"],
              ["Available", (r) => String(r.available)],
            ]}
            actions={(r) => (
              <Action
                service="vet"
                path={
                  "/services/" +
                  r.id +
                  "/availability?available=" +
                  !r.available
                }
                method="PATCH"
                label={r.available ? "Pause" : "Enable"}
                onDone={s.refresh}
              />
            )}
          />
        </>
      )}
    </Page>
  );
}
export function Bookings() {
  const { user } = useAuth(),
    q = useFetch("vet", "/bookings");
  return (
    <Page title="Booking Requests">
      <LoadError query={q} />
      <Table
        rows={q.data.filter((x) => x.listing.vet.userId === user.userId)}
        columns={bookingCols}
        actions={(r) =>
          r.status === "PENDING" && (
            <>
              <Action
                service="vet"
                path={"/bookings/" + r.id + "/status"}
                method="PATCH"
                body={{ status: "ACCEPTED" }}
                label="Accept"
                onDone={q.refresh}
              />
              <Action
                service="vet"
                path={"/bookings/" + r.id + "/status"}
                method="PATCH"
                body={{ status: "REJECTED" }}
                label="Reject"
                onDone={q.refresh}
              />
            </>
          )
        }
      />
    </Page>
  );
}
export function Treatment() {
  const { user } = useAuth(),
    b = useFetch("vet", "/bookings"),
    m = useFetch("pharmacy", "/medicines");
  const accepted = b.data.filter(
    (x) => x.listing.vet.userId === user.userId && x.status === "ACCEPTED",
  );
  const booking = opts(
    "bookingId",
    "Accepted booking",
    accepted,
    (x) => "#" + x.id + " · animal " + x.animalId,
  );
  return (
    <Page title="Record Treatment">
      <LoadError query={m} />
      <p className="notice">
        A treatment creates its milk block before stock deduction. If a step
        fails, use Treatment History → Retry workflow. Withdrawal ends on
        treatment date + days, inclusive. Medicine stock settings provide the
        minimum withdrawal days.
      </p>
      <Form
        title="Treatment"
        fields={[
          booking,
          opts(
            "medicineId",
            "Medicine",
            m.data.filter((x) => x.type === "MEDICINE"),
            (x) => x.name + " · stock " + x.stock,
          ),
          text("dose", "Dose"),
          n("quantity", "Stock units", 1),
          n("withdrawalDays", "Withdrawal days", 3, 0),
          date("treatmentDate", "Treatment date"),
        ]}
        onSubmit={(r) =>
          api("vet", "/treatments", "POST", {
            ...r,
            bookingId: Number(r.bookingId),
            medicineId: Number(r.medicineId),
          })
        }
      />
      <Form
        title="Vaccination"
        fields={[
          opts(
            "bookingId",
            "Booking",
            b.data.filter(
              (x) =>
                x.listing.vet.userId === user.userId &&
                ["ACCEPTED", "COMPLETED"].includes(x.status),
            ),
            (x) => "#" + x.id,
          ),
          opts(
            "medicineId",
            "Vaccine",
            m.data.filter((x) => x.type === "VACCINE"),
            (x) => x.name,
          ),
          text("dose", "Dose"),
          n("quantity", "Stock units", 1),
          date("vaccinationDate", "Vaccination date"),
        ]}
        onSubmit={(r) =>
          api("vet", "/vaccinations", "POST", {
            ...r,
            bookingId: Number(r.bookingId),
            medicineId: Number(r.medicineId),
          })
        }
      />
    </Page>
  );
}
export function Stock() {
  const q = useFetch("pharmacy", "/medicines"),
    [edit, setEdit] = useState(null);
  return (
    <Page title="Medicine and Vaccine Stock">
      <LoadError query={q} />
      <Table
        rows={q.data}
        columns={[
          ["ID", "id"],
          ["Name", "name"],
          ["Type", "type"],
          ["Stock", "stock"],
          ["Threshold", "threshold"],
          ["Expiry", "expiryDate"],
          [
            "Alert",
            (r) => (
              <Status value={r.stock < r.threshold ? "LOW STOCK" : "OK"} />
            ),
          ],
        ]}
        actions={(r) => <button onClick={() => setEdit(r)}>Edit stock</button>}
      />
      <Form
        key={edit?.id || "new"}
        title={edit ? "Update item #" + edit.id : "Add inventory item"}
        fields={[
          text("name", "Name", edit?.name),
          {
            name: "type",
            label: "Type",
            value: edit?.type || "MEDICINE",
            options: [
              { value: "MEDICINE", label: "Medicine" },
              { value: "VACCINE", label: "Vaccine" },
            ],
          },
          {
            name: "antibiotic",
            label: "Antibiotic",
            type: "checkbox",
            value: edit?.antibiotic || false,
          },
          n(
            "withdrawalDays",
            "Minimum withdrawal days",
            edit?.withdrawalDays ?? 0,
            0,
          ),
          n("stock", "Stock", edit?.stock ?? 100, 0),
          n("threshold", "Low-stock threshold", edit?.threshold ?? 10, 0),
          {
            name: "expiryDate",
            label: "Expiry date",
            type: "date",
            value: edit?.expiryDate || "2030-12-31",
          },
        ]}
        onSubmit={async (r) => {
          await api(
            "pharmacy",
            "/medicines" + (edit ? "/" + edit.id : ""),
            edit ? "PUT" : "POST",
            r,
          );
          setEdit(null);
          q.refresh();
        }}
      />
      {edit && <button onClick={() => setEdit(null)}>Cancel</button>}
    </Page>
  );
}
const reports = [
  ["withdrawal", "Animals currently under withdrawal · JOIN"],
  ["top-vets", "Vets above overall average rating · SUBQUERY"],
  ["low-stock", "Medicines below threshold · WHERE"],
  ["attention", "Farmers needing attention · UNION"],
  ["unvaccinated", "Treated without vaccination · NOT IN"],
  ["treated-vaccinated", "Treated and vaccinated · IN"],
];
export function Reports() {
  const [name, setName] = useState("withdrawal"),
    q = useFetch("pharmacy", "/reports/" + name);
  return (
    <Page title="SQL Reports">
      <label>
        Choose report{" "}
        <select value={name} onChange={(e) => setName(e.target.value)}>
          {reports.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <button onClick={q.refresh}>Refresh report</button>
      <LoadError query={q} />
      <Table
        rows={q.data}
        columns={q.data.length ? Object.keys(q.data[0]).map((k) => [k, k]) : []}
      />
    </Page>
  );
}
export function Users() {
  const q = useFetch("user", "/users");
  return (
    <Page title="Manage Users">
      <LoadError query={q} />
      <Table
        rows={q.data}
        columns={[
          ["ID", "id"],
          ["Name", "name"],
          ["Email", "email"],
          ["Role", "role"],
          ["Phone", "phone"],
        ]}
      />
      <Form
        title="Create vet or admin"
        fields={[
          text("name", "Name"),
          { name: "email", label: "Email", type: "email" },
          {
            name: "password",
            label: "Password (6+ characters)",
            type: "password",
          },
          {
            name: "role",
            label: "Role",
            options: [
              { value: "VET", label: "Vet" },
              { value: "ADMIN", label: "Admin" },
            ],
          },
          text("phone", "Phone"),
        ]}
        onSubmit={async (r) => {
          await api("user", "/users", "POST", r);
          q.refresh();
        }}
      />
      <Form
        title="Update user phone"
        fields={[n("userId", "User ID", 1), text("phone", "New phone")]}
        onSubmit={async (r) => {
          await api("user", "/users/" + r.userId + "/phone", "PUT", {
            phone: r.phone,
          });
          q.refresh();
        }}
      />
    </Page>
  );
}
