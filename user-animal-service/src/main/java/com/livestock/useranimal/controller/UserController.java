package com.livestock.useranimal.controller;

import com.livestock.useranimal.model.*;
import com.livestock.useranimal.repository.*;
import com.livestock.useranimal.security.Access;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Unit 4: academic admin endpoints; UI role protection is intentionally separate from
 * authentication.
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "${FRONTEND_ORIGIN:http://localhost:5173}"})
public class UserController {
  private final UserRepository users;

  public UserController(UserRepository u) {
    users = u;
  }

  public record Account(
      @NotBlank String name,
      @NotBlank @Email String email,
      @NotBlank @Size(min = 6) String password,
      @NotNull Role role,
      String phone) {}

  @GetMapping
  public List<User> all() {
    Access.roles("ADMIN");
    return users.findAll();
  }

  @GetMapping("/{id}")
  public User get(@PathVariable Long id) {
    return users
        .findById(id)
        .orElseThrow(
            () ->
                new com.livestock.useranimal.exception.ResourceNotFoundException("User not found"));
  }

  @PostMapping
  public User add(@Valid @RequestBody Account r) {
    Access.roles("ADMIN");
    if (r.role() == Role.FARMER)
      throw new IllegalArgumentException("Use farmer registration for farmer profiles");
    if (users.findByEmail(r.email()).isPresent())
      throw new IllegalArgumentException("Email exists");
    User u = new User();
    u.setName(r.name());
    u.setEmail(r.email());
    u.setPassword(new BCryptPasswordEncoder().encode(r.password()));
    u.setRole(r.role());
    u.setPhone(r.phone());
    return users.save(u);
  }

  @PutMapping("/{id}/phone")
  public User phone(@PathVariable Long id, @RequestBody Map<String, String> body) {
    Access.roles("ADMIN");
    User u = get(id);
    u.setPhone(body.get("phone"));
    return users.save(u);
  }
}
