package com.livestock.vet.controller;

import com.livestock.vet.dto.Requests.*;
import com.livestock.vet.model.*;
import com.livestock.vet.security.Access;
import com.livestock.vet.service.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "${FRONTEND_ORIGIN:http://localhost:5173}"})
public class VetController {
  private boolean visible(Booking b) {
    return Access.internal()
        || Access.identity()[1].equals("ADMIN")
        || (Access.identity()[1].equals("FARMER")
            ? b.farmerId.equals(Long.valueOf(Access.identity()[2]))
            : b.listing.vet.userId.equals(Access.userId()));
  }

  private final VetService s;

  public VetController(VetService s) {
    this.s = s;
  }

  @GetMapping("/vets")
  public List<VetProfile> vets() {
    return s.vets.findAll();
  }

  @PostMapping("/vets")
  public VetProfile profile(@Valid @RequestBody Profile r) {
    Access.vet(r.userId());
    return s.profile(r);
  }

  @GetMapping("/services")
  public List<ServiceListing> listings() {
    return s.listings.findAll();
  }

  @PostMapping("/services")
  public ServiceListing listing(@Valid @RequestBody Listing r) {
    Access.vet(s.vets.findById(r.vetId()).orElseThrow().userId);
    return s.listing(r);
  }

  @PatchMapping("/services/{id}/availability")
  public ServiceListing availability(@PathVariable Long id, @RequestParam boolean available) {
    Access.vet(s.listings.findById(id).orElseThrow().vet.userId);
    return s.availability(id, available);
  }

  @GetMapping("/bookings")
  public List<Booking> bookings() {
    return s.bookings.findAll().stream().filter(x -> visible(x)).toList();
  }

  @PostMapping("/bookings")
  public Booking book(@Valid @RequestBody Book r) {
    Access.roles("FARMER");
    Access.farmer(r.farmerId());
    return s.book(r);
  }

  @PatchMapping("/bookings/{id}/status")
  public Booking decide(@PathVariable Long id, @Valid @RequestBody Decision r) {
    Access.vet(s.bookings.findById(id).orElseThrow().listing.vet.userId);
    return s.decide(id, r);
  }

  @GetMapping("/treatments")
  public List<Treatment> treatments() {
    return s.treatments.findAll().stream().filter(x -> visible(x.booking)).toList();
  }

  @PostMapping("/treatments")
  public Treatment treat(@Valid @RequestBody Treat r) {
    Access.vet(s.bookings.findById(r.bookingId()).orElseThrow().listing.vet.userId);
    return s.treat(r);
  }

  @PostMapping("/treatments/{id}/retry")
  public Treatment retry(@PathVariable Long id) {
    Access.vet(s.treatments.findById(id).orElseThrow().booking.listing.vet.userId);
    return s.resume(id);
  }

  @GetMapping("/vaccinations")
  public List<Vaccination> vaccinations() {
    return s.vaccinations.findAll().stream().filter(x -> visible(x.booking)).toList();
  }

  @PostMapping("/vaccinations")
  public Vaccination vaccinate(@Valid @RequestBody Vaccinate r) {
    Access.vet(s.bookings.findById(r.bookingId()).orElseThrow().listing.vet.userId);
    return s.vaccinate(r);
  }

  @PostMapping("/vaccinations/{id}/retry")
  public Vaccination retryVaccine(@PathVariable Long id) {
    Access.vet(s.vaccinations.findById(id).orElseThrow().booking.listing.vet.userId);
    return s.retryVaccine(id);
  }

  @GetMapping("/ratings")
  public List<Rating> ratings() {
    return s.ratings.findAll();
  }

  @PostMapping("/ratings")
  public Rating rate(@Valid @RequestBody Rate r) {
    Access.roles("FARMER");
    Access.farmer(s.bookings.findById(r.bookingId()).orElseThrow().farmerId);
    return s.rate(r);
  }
}
