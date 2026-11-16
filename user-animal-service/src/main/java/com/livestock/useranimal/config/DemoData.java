package com.livestock.useranimal.config;

import com.livestock.useranimal.model.*;
import com.livestock.useranimal.model.Role;
import com.livestock.useranimal.repository.*;
import org.springframework.boot.*;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Unit 4: predictable localhost demonstration accounts. */
@Configuration
public class DemoData {
  @Bean
  CommandLineRunner seed(UserRepository users, FarmerProfileRepository farmers) {
    return args -> {
      for (Role role : Role.values()) {
        String email = role.name().toLowerCase() + "@demo.local";
        if (users.findByEmail(email).isEmpty()) {
          User u = new User();
          u.setName("Demo " + role);
          u.setEmail(email);
          u.setPassword(new BCryptPasswordEncoder().encode("Demo123!"));
          u.setRole(role);
          u = users.save(u);
          if (role == Role.FARMER) {
            FarmerProfile f = new FarmerProfile();
            f.setUser(u);
            f.setVillage("Demo Village");
            f.setAddress("College dairy");
            farmers.save(f);
          }
        }
      }
    };
  }
}
