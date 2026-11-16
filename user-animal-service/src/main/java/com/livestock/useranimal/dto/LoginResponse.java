package com.livestock.useranimal.dto;

import com.livestock.useranimal.model.Role;

public record LoginResponse(
    Long userId, String name, String email, Role role, Long farmerId, String token) {
  public LoginResponse(Long userId, String name, String email, Role role, Long farmerId) {
    this(
        userId,
        name,
        email,
        role,
        farmerId,
        com.livestock.useranimal.security.Access.token(userId, role.name(), farmerId));
  }
}
