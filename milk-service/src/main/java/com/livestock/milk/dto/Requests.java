package com.livestock.milk.dto;

import jakarta.validation.constraints.*;
import java.math.*;
import java.time.*;

public class Requests {
  public record Yield(
      @NotNull Long animalId,
      @NotNull Long farmerId,
      @NotNull @PastOrPresent LocalDate recordDate,
      @NotNull @DecimalMin("0.001") BigDecimal litres) {}

  public record Sale(
      @NotNull Long animalId,
      @NotNull Long farmerId,
      @NotNull @DecimalMin("0.001") BigDecimal litres,
      @NotNull @DecimalMin("0.01") BigDecimal pricePerLitre) {}

  public record Block(
      @NotNull Long treatmentId,
      @NotNull Long animalId,
      @NotNull Long farmerId,
      @NotNull LocalDate startDate,
      @NotNull LocalDate endDate,
      @NotBlank String medicine) {}
}
