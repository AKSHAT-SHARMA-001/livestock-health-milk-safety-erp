package com.livestock.vet.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "service_listings")
public class ServiceListing {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "vet_id")
  public VetProfile vet;

  @Column(nullable = false)
  public String title;

  @Column(nullable = false, precision = 12, scale = 2)
  public java.math.BigDecimal price;

  public boolean available = true;
}
