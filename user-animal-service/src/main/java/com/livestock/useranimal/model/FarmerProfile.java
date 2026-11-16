package com.livestock.useranimal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

/** Unit 5: farmer-specific data is separate from login details. */
@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(optional = false)
  @JoinColumn(name = "user_id", unique = true)
  private User user;

  @NotBlank private String village;
  private String address;

  public Long getId() {
    return id;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public String getVillage() {
    return village;
  }

  public void setVillage(String village) {
    this.village = village;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }
}
