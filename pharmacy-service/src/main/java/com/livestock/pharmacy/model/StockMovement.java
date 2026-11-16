package com.livestock.pharmacy.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "stock_movements")
public class StockMovement {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(nullable = false, unique = true)
  public String requestKey;

  @ManyToOne(optional = false)
  @JoinColumn(name = "medicine_id")
  public Medicine medicine;

  public int quantity;
  public java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
