package com.livestock.useranimal.controller;

import com.livestock.useranimal.dto.*;
import com.livestock.useranimal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/** Unit 4: REST presentation endpoints for login and farmer signup. */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "${FRONTEND_ORIGIN:http://localhost:5173}"})
public class AuthController {
  private final UserService service;

  public AuthController(UserService service) {
    this.service = service;
  }

  @PostMapping("/register/farmer")
  @ResponseStatus(HttpStatus.CREATED)
  public LoginResponse register(@Valid @RequestBody RegisterFarmerRequest request) {
    return service.registerFarmer(request);
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return service.login(request);
  }
}
