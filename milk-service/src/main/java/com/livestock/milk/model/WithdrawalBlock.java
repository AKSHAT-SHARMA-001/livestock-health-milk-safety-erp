package com.livestock.milk.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "withdrawal_blocks")
public class WithdrawalBlock {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(nullable = false, unique = true)
  public Long treatmentId;

  public Long animalId;
  public Long farmerId;
  public java.time.LocalDate startDate;
  public java.time.LocalDate endDate;
  public String medicine;
}
