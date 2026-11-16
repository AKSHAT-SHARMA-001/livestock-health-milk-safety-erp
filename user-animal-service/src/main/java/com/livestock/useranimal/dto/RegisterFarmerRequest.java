package com.livestock.useranimal.dto;

import jakarta.validation.constraints.*;

public record RegisterFarmerRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @NotBlank String password,
    String phone,
    @NotBlank String village,
    String address) {}
