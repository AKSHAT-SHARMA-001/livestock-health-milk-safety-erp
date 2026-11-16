package com.livestock.vet.dto;

import jakarta.validation.constraints.*;
import java.math.*;
import java.time.*;

public class Requests {
  public record Profile(
      @NotNull Long userId, @NotBlank String name, String specialization, String phone) {}

  public record Listing(
      @NotNull Long vetId,
      @NotBlank String title,
      @NotNull @DecimalMin("0.01") BigDecimal price,
      boolean available) {}

  public record Book(
      @NotNull Long listingId,
      @NotNull Long farmerId,
      @NotNull Long animalId,
      @NotNull @FutureOrPresent LocalDate appointmentDate) {}

  public record Decision(@Pattern(regexp = "ACCEPTED|REJECTED") @NotNull String status) {}

  public record Treat(
      @NotNull Long bookingId,
      @NotNull Long medicineId,
      @NotBlank String dose,
      @Min(1) int quantity,
      @Min(0) int withdrawalDays,
      @NotNull @PastOrPresent LocalDate treatmentDate) {}

  public record Vaccinate(
      @NotNull Long bookingId,
      @NotNull Long medicineId,
      @NotBlank String dose,
      @Min(1) int quantity,
      @NotNull @PastOrPresent LocalDate vaccinationDate) {}

  public record Rate(@NotNull Long bookingId, @Min(1) @Max(5) int score, String comment) {}
}
