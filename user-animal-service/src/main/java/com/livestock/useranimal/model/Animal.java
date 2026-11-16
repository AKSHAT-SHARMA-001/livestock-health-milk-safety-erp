package com.livestock.useranimal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** Unit 4: animal health domain model. */
@Entity
@Table(name = "animals", uniqueConstraints = @UniqueConstraint(columnNames = "tagNumber"))
public class Animal {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank private String tagNumber;
  @NotBlank private String breed;

  @Min(0)
  private int age;

  @NotBlank private String healthStatus = "HEALTHY";

  @ManyToOne(optional = false)
  @JoinColumn(name = "farmer_id")
  private FarmerProfile farmer;

  public Long getId() {
    return id;
  }

  public String getTagNumber() {
    return tagNumber;
  }

  public void setTagNumber(String tagNumber) {
    this.tagNumber = tagNumber;
  }

  public String getBreed() {
    return breed;
  }

  public void setBreed(String breed) {
    this.breed = breed;
  }

  public int getAge() {
    return age;
  }

  public void setAge(int age) {
    this.age = age;
  }

  public String getHealthStatus() {
    return healthStatus;
  }

  public void setHealthStatus(String healthStatus) {
    this.healthStatus = healthStatus;
  }

  public FarmerProfile getFarmer() {
    return farmer;
  }

  public void setFarmer(FarmerProfile farmer) {
    this.farmer = farmer;
  }
}
