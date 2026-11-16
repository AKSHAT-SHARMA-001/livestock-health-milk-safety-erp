package com.livestock.vet.service;

import com.livestock.vet.dto.Requests.*;
import com.livestock.vet.model.*;
import com.livestock.vet.repository.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/** Units 4/5: business layer and REST coordination; no cross-service JPA relations. */
@Service
public class VetService {
  public final VetProfileRepository vets;
  public final ServiceListingRepository listings;
  public final BookingRepository bookings;
  public final TreatmentRepository treatments;
  public final VaccinationRepository vaccinations;
  public final RatingRepository ratings;
  private final RestClient rest =
      RestClient.builder()
          .defaultHeader("X-Service-Key", com.livestock.vet.security.Access.serviceKey())
          .build();

  @Value("${erp.user-url}")
  private String userUrl;

  @Value("${erp.pharmacy-url}")
  private String pharmacyUrl;

  @Value("${erp.milk-url}")
  private String milkUrl;

  public VetService(
      VetProfileRepository v,
      ServiceListingRepository l,
      BookingRepository b,
      TreatmentRepository t,
      VaccinationRepository x,
      RatingRepository r) {
    vets = v;
    listings = l;
    bookings = b;
    treatments = t;
    vaccinations = x;
    ratings = r;
  }

  private <T> T required(Optional<T> x) {
    return x.orElseThrow(() -> new NoSuchElementException("Record not found"));
  }

  public VetProfile profile(Profile r) {
    Map<?, ?> u = rest.get().uri(userUrl + "/api/users/" + r.userId()).retrieve().body(Map.class);
    if (!"VET".equals(u.get("role"))) throw new IllegalArgumentException("User must have VET role");
    VetProfile v = new VetProfile();
    v.userId = r.userId();
    v.name = r.name();
    v.specialization = r.specialization();
    v.phone = r.phone();
    return vets.save(v);
  }

  public ServiceListing listing(Listing r) {
    ServiceListing l = new ServiceListing();
    l.vet = required(vets.findById(r.vetId()));
    l.title = r.title();
    l.price = r.price();
    l.available = r.available();
    return listings.save(l);
  }

  public ServiceListing availability(Long id, boolean available) {
    ServiceListing l = required(listings.findById(id));
    l.available = available;
    return listings.save(l);
  }

  public Booking book(Book r) {
    ServiceListing l = required(listings.findById(r.listingId()));
    if (!l.available) throw new IllegalStateException("Service unavailable");
    Map<?, ?> a =
        rest.get().uri(userUrl + "/api/animals/" + r.animalId()).retrieve().body(Map.class);
    if (((Number) ((Map<?, ?>) a.get("farmer")).get("id")).longValue() != r.farmerId())
      throw new IllegalArgumentException("Animal does not belong to farmer");
    Booking x = new Booking();
    x.listing = l;
    x.farmerId = r.farmerId();
    x.animalId = r.animalId();
    x.appointmentDate = r.appointmentDate();
    x.fee = l.price;
    return bookings.save(x);
  }

  public synchronized Booking decide(Long id, Decision r) {
    Booking b = required(bookings.findById(id));
    if (!"PENDING".equals(b.status)) throw new IllegalStateException("Booking already decided");
    b.status = r.status();
    return bookings.save(b);
  }

  public Map<?, ?> medicine(Long id) {
    return rest.get().uri(pharmacyUrl + "/api/medicines/" + id).retrieve().body(Map.class);
  }

  private void deduct(Long id, int quantity, String key) {
    rest.post()
        .uri(pharmacyUrl + "/api/stock/deduct")
        .body(Map.of("medicineId", id, "quantity", quantity, "requestKey", key))
        .retrieve()
        .toBodilessEntity();
  }

  /**
   * Save each step before the next remote call. Retry resumes a failed workflow. Block first for
   * safety.
   */
  public synchronized Treatment treat(Treat r) {
    Booking b = required(bookings.findById(r.bookingId()));
    if (!"ACCEPTED".equals(b.status)) throw new IllegalStateException("Booking must be accepted");
    if (treatments.findAll().stream().anyMatch(t -> t.booking.id.equals(b.id)))
      throw new IllegalStateException("Treatment already exists; use retry endpoint");
    Map<?, ?> m = medicine(r.medicineId());
    if (!"MEDICINE".equals(m.get("type"))) throw new IllegalArgumentException("Select a medicine");
    Treatment t = new Treatment();
    t.booking = b;
    t.medicineId = r.medicineId();
    t.medicine = (String) m.get("name");
    t.dose = r.dose();
    t.quantity = r.quantity();
    t.antibiotic = Boolean.TRUE.equals(m.get("antibiotic"));
    t.withdrawalDays = Math.max(r.withdrawalDays(), ((Number) m.get("withdrawalDays")).intValue());
    t.treatmentDate = r.treatmentDate();
    t.endDate = t.treatmentDate.plusDays(t.withdrawalDays);
    t = treatments.save(t);
    return resume(t.id);
  }

  public synchronized Treatment resume(Long id) {
    Treatment t = required(treatments.findById(id));
    if ("COMPLETED".equals(t.status)) return t;
    if (t.antibiotic && !t.blockCreated) {
      rest.post()
          .uri(milkUrl + "/api/withdrawal-blocks")
          .body(
              Map.of(
                  "treatmentId",
                  t.id,
                  "animalId",
                  t.booking.animalId,
                  "farmerId",
                  t.booking.farmerId,
                  "startDate",
                  t.treatmentDate,
                  "endDate",
                  t.endDate,
                  "medicine",
                  t.medicine))
          .retrieve()
          .toBodilessEntity();
      t.blockCreated = true;
      t = treatments.save(t);
    }
    if (!t.stockDeducted) {
      deduct(t.medicineId, t.quantity, "treatment-" + t.id);
      t.stockDeducted = true;
      t = treatments.save(t);
    }
    t.status = "COMPLETED";
    t = treatments.save(t);
    Booking b = t.booking;
    b.status = "COMPLETED";
    bookings.save(b);
    return t;
  }

  public synchronized Vaccination vaccinate(Vaccinate r) {
    Booking b = required(bookings.findById(r.bookingId()));
    if (!Set.of("ACCEPTED", "COMPLETED").contains(b.status))
      throw new IllegalStateException("Accept booking first");
    Map<?, ?> m = medicine(r.medicineId());
    if (!"VACCINE".equals(m.get("type"))) throw new IllegalArgumentException("Select a vaccine");
    Vaccination v = new Vaccination();
    v.booking = b;
    v.medicineId = r.medicineId();
    v.vaccine = (String) m.get("name");
    v.dose = r.dose();
    v.quantity = r.quantity();
    v.vaccinationDate = r.vaccinationDate();
    v = vaccinations.save(v);
    return retryVaccine(v.id);
  }

  public synchronized Vaccination retryVaccine(Long id) {
    Vaccination v = required(vaccinations.findById(id));
    if (!v.stockDeducted) {
      deduct(v.medicineId, v.quantity, "vaccination-" + v.id);
      v.stockDeducted = true;
      v = vaccinations.save(v);
    }
    Booking b = v.booking;
    b.status = "COMPLETED";
    bookings.save(b);
    return v;
  }

  public synchronized Rating rate(Rate r) {
    Booking b = required(bookings.findById(r.bookingId()));
    if (!"COMPLETED".equals(b.status))
      throw new IllegalStateException("Complete booking before rating");
    Rating x = new Rating();
    x.booking = b;
    x.score = r.score();
    x.comment = r.comment();
    return ratings.save(x);
  }
}
