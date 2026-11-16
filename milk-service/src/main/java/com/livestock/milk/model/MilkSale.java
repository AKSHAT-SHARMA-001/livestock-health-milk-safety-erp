package com.livestock.milk.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "milk_sales")
public class MilkSale {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long animalId;
  public Long farmerId;
  public java.time.LocalDate saleDate;

  @Column(precision = 12, scale = 3)
  public java.math.BigDecimal litres;

  @Column(precision = 12, scale = 2)
  public java.math.BigDecimal pricePerLitre;
}
