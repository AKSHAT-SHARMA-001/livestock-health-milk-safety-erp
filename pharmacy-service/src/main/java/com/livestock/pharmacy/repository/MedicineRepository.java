package com.livestock.pharmacy.repository;

import com.livestock.pharmacy.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select m from Medicine m where m.id = :id")
  java.util.Optional<Medicine> lockById(
      @org.springframework.data.repository.query.Param("id") Long id);
}
