package com.livestock.vet.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "bookings")
public class Booking {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "listing_id")
  public ServiceListing listing;

  @Column(nullable = false)
  public Long farmerId;

  @Column(nullable = false)
  public Long animalId;

  public java.time.LocalDate appointmentDate;
  public String status = "PENDING";

  @Column(precision = 12, scale = 2)
  public java.math.BigDecimal fee;
}
