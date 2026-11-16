package com.livestock.useranimal.dto;

import jakarta.validation.constraints.*;

public record AnimalRequest(
    @NotBlank String tagNumber,
    @NotBlank String breed,
    @Min(0) int age,
    @NotBlank String healthStatus) {}
