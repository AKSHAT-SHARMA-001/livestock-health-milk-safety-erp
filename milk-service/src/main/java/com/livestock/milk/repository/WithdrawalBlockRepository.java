package com.livestock.milk.repository;

import com.livestock.milk.model.WithdrawalBlock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawalBlockRepository extends JpaRepository<WithdrawalBlock, Long> {
  java.util.Optional<WithdrawalBlock> findByTreatmentId(Long treatmentId);

  java.util.List<WithdrawalBlock> findByAnimalId(Long animalId);
}
