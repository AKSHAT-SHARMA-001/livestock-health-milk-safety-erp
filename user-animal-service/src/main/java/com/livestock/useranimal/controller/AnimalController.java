package com.livestock.useranimal.controller;

import com.livestock.useranimal.dto.AnimalRequest;
import com.livestock.useranimal.model.Animal;
import com.livestock.useranimal.security.Access;
import com.livestock.useranimal.service.AnimalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/** Unit 4: Controller -> Service -> Repository example used in the viva. */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "${FRONTEND_ORIGIN:http://localhost:5173}"})
public class AnimalController {
  private final AnimalService service;

  public AnimalController(AnimalService service) {
    this.service = service;
  }

  @PostMapping("/farmers/{farmerId}/animals")
  @ResponseStatus(HttpStatus.CREATED)
  public Animal add(@PathVariable Long farmerId, @Valid @RequestBody AnimalRequest request) {
    Access.roles("FARMER", "ADMIN");
    Access.farmer(farmerId);
    return service.add(farmerId, request);
  }

  @GetMapping("/farmers/{farmerId}/animals")
  public List<Animal> list(@PathVariable Long farmerId) {
    Access.farmer(farmerId);
    return service.listByFarmer(farmerId);
  }

  @GetMapping("/animals/{id}")
  public Animal get(@PathVariable Long id) {
    Animal a = service.get(id);
    if ("FARMER".equals(Access.identity()[1])) Access.farmer(a.getFarmer().getId());
    return a;
  }

  @PutMapping("/animals/{id}")
  public Animal update(@PathVariable Long id, @Valid @RequestBody AnimalRequest request) {
    Access.farmer(service.get(id).getFarmer().getId());
    return service.update(id, request);
  }

  @DeleteMapping("/animals/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    Access.farmer(service.get(id).getFarmer().getId());
    service.delete(id);
  }
}
