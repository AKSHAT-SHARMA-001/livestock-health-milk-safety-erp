package com.livestock.useranimal.service;

import com.livestock.useranimal.dto.AnimalRequest;
import com.livestock.useranimal.exception.ResourceNotFoundException;
import com.livestock.useranimal.model.*;
import com.livestock.useranimal.repository.*;
import java.util.List;
import org.springframework.stereotype.Service;

/** Unit 4/5: animal business rules and JPA data access. */
@Service
public class AnimalService {
  private final AnimalRepository animals;
  private final FarmerProfileRepository farmers;

  public AnimalService(AnimalRepository animals, FarmerProfileRepository farmers) {
    this.animals = animals;
    this.farmers = farmers;
  }

  public Animal add(Long farmerId, AnimalRequest request) {
    if (animals.existsByTagNumber(request.tagNumber()))
      throw new IllegalArgumentException("Tag number already exists.");
    FarmerProfile farmer =
        farmers
            .findById(farmerId)
            .orElseThrow(() -> new ResourceNotFoundException("Farmer not found: " + farmerId));
    Animal animal = new Animal();
    copy(request, animal);
    animal.setFarmer(farmer);
    return animals.save(animal);
  }

  public List<Animal> listByFarmer(Long farmerId) {
    return animals.findByFarmerId(farmerId);
  }

  public Animal get(Long id) {
    return animals
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Animal not found: " + id));
  }

  public Animal update(Long id, AnimalRequest request) {
    Animal animal = get(id);
    copy(request, animal);
    return animals.save(animal);
  }

  public void delete(Long id) {
    animals.delete(get(id));
  }

  private void copy(AnimalRequest request, Animal animal) {
    animal.setTagNumber(request.tagNumber());
    animal.setBreed(request.breed());
    animal.setAge(request.age());
    animal.setHealthStatus(request.healthStatus());
  }
}
