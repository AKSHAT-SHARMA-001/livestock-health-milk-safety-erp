package com.livestock.useranimal.repository;

import com.livestock.useranimal.model.Animal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
  boolean existsByTagNumber(String tagNumber);

  List<Animal> findByFarmerId(Long farmerId);
}
