package com.livestock.pharmacy.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class Requests {
  public record Item(
      @NotBlank String name,
      @Pattern(regexp = "MEDICINE|VACCINE") @NotNull String type,
      boolean antibiotic,
      @Min(0) int withdrawalDays,
      @Min(0) int stock,
      @Min(0) int threshold,
      @NotNull LocalDate expiryDate) {}

  public record Deduct(
      @NotBlank String requestKey, @NotNull Long medicineId, @Min(1) int quantity) {}
}
