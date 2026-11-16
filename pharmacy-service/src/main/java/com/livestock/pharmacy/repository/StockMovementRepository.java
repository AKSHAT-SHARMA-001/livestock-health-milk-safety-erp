package com.livestock.pharmacy.repository;

import com.livestock.pharmacy.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
  java.util.Optional<StockMovement> findByRequestKey(String requestKey);
}
