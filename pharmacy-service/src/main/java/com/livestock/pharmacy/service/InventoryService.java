package com.livestock.pharmacy.service;

import com.livestock.pharmacy.dto.Requests.*;
import com.livestock.pharmacy.model.*;
import com.livestock.pharmacy.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
  private final MedicineRepository medicines;
  private final StockMovementRepository movements;

  public InventoryService(MedicineRepository m, StockMovementRepository s) {
    medicines = m;
    movements = s;
  }

  public List<Medicine> all() {
    return medicines.findAll();
  }

  public Medicine get(Long id) {
    return medicines
        .findById(id)
        .orElseThrow(() -> new NoSuchElementException("Medicine not found"));
  }

  public Medicine save(Long id, Item r) {
    Medicine m = id == null ? new Medicine() : get(id);
    m.name = r.name();
    m.type = r.type();
    m.antibiotic = r.antibiotic();
    m.withdrawalDays = r.withdrawalDays();
    m.stock = r.stock();
    m.threshold = r.threshold();
    m.expiryDate = r.expiryDate();
    return medicines.save(m);
  }

  /** Unit 4/5: lock stock row; an idempotency key prevents a retry deducting twice. */
  @Transactional
  public StockMovement deduct(Deduct r) {
    Medicine m =
        medicines
            .lockById(r.medicineId())
            .orElseThrow(() -> new NoSuchElementException("Medicine not found"));
    var old = movements.findByRequestKey(r.requestKey());
    if (old.isPresent()) {
      StockMovement s = old.get();
      if (!s.medicine.id.equals(r.medicineId()) || s.quantity != r.quantity())
        throw new IllegalStateException("Idempotency key reused with different details");
      return s;
    }
    if (m.expiryDate.isBefore(LocalDate.now()))
      throw new IllegalStateException("Medicine has expired");
    if (m.stock < r.quantity()) throw new IllegalStateException("Insufficient medicine stock");
    m.stock -= r.quantity();
    medicines.save(m);
    StockMovement s = new StockMovement();
    s.medicine = m;
    s.quantity = r.quantity();
    s.requestKey = r.requestKey();
    return movements.save(s);
  }
}
