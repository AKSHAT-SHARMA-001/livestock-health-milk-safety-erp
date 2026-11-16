package com.livestock.vet.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "vet_profiles")
public class VetProfile {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(nullable = false, unique = true)
  public Long userId;

  @Column(nullable = false)
  public String name;

  public String specialization;
  public String phone;
}
