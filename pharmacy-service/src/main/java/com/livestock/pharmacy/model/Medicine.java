package com.livestock.pharmacy.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "medicines")
public class Medicine {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(nullable = false)
  public String name;

  public String type;
  public boolean antibiotic;
  public int withdrawalDays;
  public int stock;
  public int threshold;
  public java.time.LocalDate expiryDate;
}
