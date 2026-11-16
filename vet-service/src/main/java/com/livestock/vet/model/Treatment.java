package com.livestock.vet.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "treatments")
public class Treatment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @OneToOne(optional = false)
  @JoinColumn(name = "booking_id", unique = true)
  public Booking booking;

  public Long medicineId;
  public String medicine;
  public String dose;
  public int quantity;
  public boolean antibiotic;
  public int withdrawalDays;
  public java.time.LocalDate treatmentDate;
  public java.time.LocalDate endDate;
  public boolean blockCreated;
  public boolean stockDeducted;
  public String status = "PROCESSING";
}
