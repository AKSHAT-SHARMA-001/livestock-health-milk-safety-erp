package com.livestock.vet.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "vaccinations")
public class Vaccination {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "booking_id")
  public Booking booking;

  public Long medicineId;
  public String vaccine;
  public String dose;
  public int quantity;
  public java.time.LocalDate vaccinationDate;
  public boolean stockDeducted;
}
