package com.livestock.vet.model;

import jakarta.persistence.*;

/** Unit 5: JPA entity; public fields keep this academic model easy to read. */
@Entity
@Table(name = "ratings")
public class Rating {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @OneToOne(optional = false)
  @JoinColumn(name = "booking_id", unique = true)
  public Booking booking;

  public int score;
  public String comment;
}
