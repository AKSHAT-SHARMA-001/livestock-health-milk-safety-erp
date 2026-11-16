package com.livestock.milk.service;

import com.livestock.milk.dto.Requests.*;
import com.livestock.milk.model.*;
import com.livestock.milk.repository.*;
import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;

@Service
public class MilkService {
  private final MilkRecordRepository records;
  private final MilkSaleRepository sales;
  private final WithdrawalBlockRepository blocks;
  private final TransactionTemplate tx;
  private final RestClient rest =
      RestClient.builder()
          .defaultHeader("X-Service-Key", com.livestock.milk.security.Access.serviceKey())
          .build();

  @Value("${erp.user-url}")
  private String userUrl;

  public MilkService(
      MilkRecordRepository r,
      MilkSaleRepository s,
      WithdrawalBlockRepository b,
      PlatformTransactionManager manager) {
    records = r;
    sales = s;
    blocks = b;
    tx = new TransactionTemplate(manager);
  }

  private void owner(Long animal, Long farmer) {
    Map<?, ?> a = rest.get().uri(userUrl + "/api/animals/" + animal).retrieve().body(Map.class);
    Map<?, ?> f = (Map<?, ?>) a.get("farmer");
    if (!farmer.equals(((Number) f.get("id")).longValue()))
      throw new IllegalArgumentException("Animal does not belong to farmer");
  }

  public List<MilkRecord> records() {
    return records.findAll();
  }

  public List<MilkSale> sales() {
    return sales.findAll();
  }

  public List<WithdrawalBlock> blocks() {
    return blocks.findAll();
  }

  public synchronized MilkRecord record(Yield r) {
    owner(r.animalId(), r.farmerId());
    MilkRecord m = new MilkRecord();
    m.animalId = r.animalId();
    m.farmerId = r.farmerId();
    m.recordDate = r.recordDate();
    m.litres = r.litres();
    return records.save(m);
  }

  public synchronized WithdrawalBlock block(Block r) {
    if (r.endDate().isBefore(r.startDate()))
      throw new IllegalArgumentException("End date precedes start date");
    var old = blocks.findByTreatmentId(r.treatmentId());
    if (old.isPresent()) {
      WithdrawalBlock w = old.get();
      if (!w.animalId.equals(r.animalId()) || !w.endDate.equals(r.endDate()))
        throw new IllegalStateException("Treatment block details changed");
      return w;
    }
    WithdrawalBlock w = new WithdrawalBlock();
    w.treatmentId = r.treatmentId();
    w.animalId = r.animalId();
    w.farmerId = r.farmerId();
    w.startDate = r.startDate();
    w.endDate = r.endDate();
    w.medicine = r.medicine();
    return blocks.save(w);
  }

  /** Unit 4: inclusive end date; sale is safe beginning the following day. */
  public Map<String, Object> eligibility(Long id) {
    LocalDate today = LocalDate.now();
    var active =
        blocks.findByAnimalId(id).stream()
            .filter(w -> !today.isBefore(w.startDate) && !today.isAfter(w.endDate))
            .toList();
    LocalDate end =
        active.stream().map(w -> w.endDate).max(LocalDate::compareTo).orElse(today.minusDays(1));
    return Map.of(
        "allowed",
        active.isEmpty(),
        "remainingDays",
        active.isEmpty() ? 0 : ChronoUnit.DAYS.between(today, end) + 1,
        "endDate",
        end);
  }

  /** One instance per service in this student project. Monitor covers the full transaction. */
  public synchronized MilkSale sell(Sale r) {
    return tx.execute(
        status -> {
          owner(r.animalId(), r.farmerId());
          var e = eligibility(r.animalId());
          if (!(Boolean) e.get("allowed"))
            throw new IllegalStateException(
                "Milk sale blocked: "
                    + e.get("remainingDays")
                    + " withdrawal day(s) remaining, through "
                    + e.get("endDate"));
          BigDecimal yielded =
              records.findAll().stream()
                  .filter(
                      x ->
                          x.animalId.equals(r.animalId()) && !x.recordDate.isAfter(LocalDate.now()))
                  .map(x -> x.litres)
                  .reduce(BigDecimal.ZERO, BigDecimal::add);
          BigDecimal sold =
              sales.findAll().stream()
                  .filter(x -> x.animalId.equals(r.animalId()))
                  .map(x -> x.litres)
                  .reduce(BigDecimal.ZERO, BigDecimal::add);
          // Exclude all milk collected during any withdrawal interval, including expired ones.
          BigDecimal unsafe =
              records.findAll().stream()
                  .filter(
                      x ->
                          x.animalId.equals(r.animalId())
                              && blocks.findByAnimalId(r.animalId()).stream()
                                  .anyMatch(
                                      w ->
                                          !x.recordDate.isBefore(w.startDate)
                                              && !x.recordDate.isAfter(w.endDate)))
                  .map(x -> x.litres)
                  .reduce(BigDecimal.ZERO, BigDecimal::add);
          if (yielded.subtract(unsafe).subtract(sold).compareTo(r.litres()) < 0)
            throw new IllegalStateException("Insufficient safe milk recorded");
          MilkSale s = new MilkSale();
          s.animalId = r.animalId();
          s.farmerId = r.farmerId();
          s.saleDate = LocalDate.now();
          s.litres = r.litres();
          s.pricePerLitre = r.pricePerLitre();
          return sales.save(s);
        });
  }
}
