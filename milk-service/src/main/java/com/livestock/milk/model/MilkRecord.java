package com.livestock.milk.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "milk_records")
public class MilkRecord {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long animalId;
  public Long farmerId;
  public java.time.LocalDate recordDate;

  @Column(precision = 12, scale = 3)
  public java.math.BigDecimal litres;
}
