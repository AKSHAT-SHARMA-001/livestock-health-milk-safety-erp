import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "./api";
import { LoadError, Status } from "./components";
import { isTestListing } from "./catalogue";

export default function VetDirectory() {
  const vets = useFetch("vet", "/vets");
  const services = useFetch("vet", "/services");
  const ratings = useFetch("vet", "/ratings");
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const hiddenCount = services.data.filter(isTestListing).length;
  const specialties = [
    ...new Set(vets.data.map((v) => v.specialization).filter(Boolean)),
  ].sort();
  const groups = useMemo(
    () =>
      vets.data
        .map((vet) => {
          const listed = services.data.filter(
            (s) => s.vet.id === vet.id && (showTests || !isTestListing(s)),
          );
          const matchesVet = (vet.name + " " + (vet.specialization || ""))
            .toLowerCase()
            .includes(search.trim().toLowerCase());
          const offerings = listed.filter(
            (s) =>
              (!availableOnly || s.available) &&
              (matchesVet ||
                s.title.toLowerCase().includes(search.trim().toLowerCase())),
          );
          return { vet, offerings };
        })
        .filter(
          (g) =>
            (!specialty || g.vet.specialization === specialty) &&
            g.offerings.length,
        ),
    [vets.data, services.data, search, specialty, availableOnly, showTests],
  );
  const loading = vets.loading || services.loading;
  const unavailable = vets.error || services.error;
  return (
    <section className="vet-directory">
      <div className="page-heading">
        <div>
          <h1>Veterinarians</h1>
          <p>
            Compare services and fees, then book a visit for one of your
            animals.
          </p>
        </div>
        <span className="directory-count">
          {loading ? "Loading…" : groups.length + " veterinarians"}
        </span>
      </div>
      <p className="sample-note">
        Profiles marked “Sample” are fictitious records for this project. Fees
        are demonstration values.
      </p>
      <div className="directory-filters">
        <label>
          Search
          <input
            type="search"
            placeholder="Name, specialty or service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Specialty
          <select
            aria-label="Specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Accepting bookings only
        </label>
      </div>
      <LoadError query={vets} />
      <LoadError query={services} />
      {!loading &&
        !unavailable &&
        (groups.length ? (
          <div className="table-scroll directory-table">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Visit fee</th>
                  <th>Availability</th>
                  <th>
                    <span className="sr-only">Booking</span>
                  </th>
                </tr>
              </thead>
              {groups.map(({ vet, offerings }) => {
                const reviews = ratings.data.filter(
                  (r) => r.booking.listing.vet.id === vet.id &&
                    (showTests || !isTestListing(r.booking.listing)),
                );
                const average = reviews.length
                  ? (
                      reviews.reduce((sum, r) => sum + r.score, 0) /
                      reviews.length
                    ).toFixed(1)
                  : null;
                const sample = /\((Sample|Demo)\)|^Demo /.test(vet.name);
                return (
                  <tbody key={vet.id}>
                    <tr className="vet-group">
                      <th colSpan="4">
                        <div className="vet-group-heading">
                          <div>
                            <h2>
                              {vet.name.replace(/ \((Sample|Demo)\)$/, "")}
                              {sample && (
                                <span className="sample-label">Sample</span>
                              )}
                            </h2>
                            <p>
                              {vet.specialization || "General veterinary care"}
                            </p>
                          </div>
                          <div className="vet-review">
                            {ratings.error ? (
                              "Ratings unavailable"
                            ) : ratings.loading ? (
                              "Loading ratings…"
                            ) : average ? (
                              <>
                                <strong>{average} / 5</strong>
                                <span>
                                  {reviews.length}{" "}
                                  {reviews.length === 1 ? "review" : "reviews"}
                                </span>
                              </>
                            ) : (
                              "No reviews yet"
                            )}
                          </div>
                        </div>
                      </th>
                    </tr>
                    {offerings.map((s) => (
                      <tr key={s.id}>
                        <td>{s.title}</td>
                        <td>₹{Number(s.price).toLocaleString("en-IN")}</td>
                        <td>
                          <Status
                            value={s.available ? "AVAILABLE" : "UNAVAILABLE"}
                          />
                        </td>
                        <td>
                          {s.available ? (
                            <Link
                              className="booking-link"
                              aria-label={
                                "Book " + s.title + " with " + vet.name
                              }
                              to={"/book?service=" + s.id}
                            >
                              Book visit
                            </Link>
                          ) : (
                            <span className="muted">
                              Not accepting bookings
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        ) : (
          <div className="directory-empty">
            <h2>No matching services</h2>
            <p>
              Try another name or specialty, or turn off the availability
              filter.
            </p>
            <button
              className="secondary"
              onClick={() => {
                setSearch("");
                setSpecialty("");
                setAvailableOnly(false);
              }}
            >
              Clear filters
            </button>
          </div>
        ))}
      {!!hiddenCount && (
        <p className="test-listing-note">
          {showTests
            ? "Automated-test listings are included."
            : hiddenCount +
              " automated-test listings are hidden from this directory."}{" "}
          <button onClick={() => setShowTests(!showTests)}>
            {showTests ? "Hide test listings" : "Show test listings"}
          </button>
        </p>
      )}
    </section>
  );
}
