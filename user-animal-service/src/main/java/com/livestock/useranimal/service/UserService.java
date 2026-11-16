package com.livestock.useranimal.service;

import com.livestock.useranimal.dto.*;
import com.livestock.useranimal.exception.ResourceNotFoundException;
import com.livestock.useranimal.model.*;
import com.livestock.useranimal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Unit 4: business layer for registration and simple academic-demo login. */
@Service
public class UserService {
  private final UserRepository users;
  private final FarmerProfileRepository farmers;

  public UserService(UserRepository users, FarmerProfileRepository farmers) {
    this.users = users;
    this.farmers = farmers;
  }

  @Transactional
  public LoginResponse registerFarmer(RegisterFarmerRequest request) {
    if (users.findByEmail(request.email()).isPresent())
      throw new IllegalArgumentException("Email is already registered.");
    User user = new User();
    user.setName(request.name());
    user.setEmail(request.email());
    user.setPassword(
        new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
            .encode(request.password()));
    user.setPhone(request.phone());
    user.setRole(Role.FARMER);
    users.save(user);
    FarmerProfile farmer = new FarmerProfile();
    farmer.setUser(user);
    farmer.setVillage(request.village());
    farmer.setAddress(request.address());
    farmers.save(farmer);
    return new LoginResponse(
        user.getId(), user.getName(), user.getEmail(), user.getRole(), farmer.getId());
  }

  public LoginResponse login(LoginRequest request) {
    User user =
        users
            .findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
    if (!new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
        .matches(request.password(), user.getPassword()))
      throw new IllegalArgumentException("Invalid email or password.");
    Long farmerId =
        user.getRole() == Role.FARMER
            ? farmers.findByUserId(user.getId()).map(FarmerProfile::getId).orElse(null)
            : null;
    return new LoginResponse(
        user.getId(), user.getName(), user.getEmail(), user.getRole(), farmerId);
  }

  public User findUser(Long id) {
    return users
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
  }
}
