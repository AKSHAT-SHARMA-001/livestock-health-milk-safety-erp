package com.livestock.milk.controller;

import com.livestock.milk.dto.Requests.*;
import com.livestock.milk.model.*;
import com.livestock.milk.security.Access;
import com.livestock.milk.service.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "${FRONTEND_ORIGIN:http://localhost:5173}"})
public class MilkController {
  private final MilkService service;

  public MilkController(MilkService s) {
    service = s;
  }

  @GetMapping("/milk-records")
  public List<MilkRecord> records() {
    return service.records().stream()
        .filter(
            x ->
                Access.internal()
                    || Access.identity()[1].equals("ADMIN")
                    || x.farmerId.equals(Long.valueOf(Access.identity()[2])))
        .toList();
  }

  @PostMapping("/milk-records")
  public MilkRecord record(@Valid @RequestBody Yield r) {
    Access.roles("FARMER");
    Access.farmer(r.farmerId());
    return service.record(r);
  }

  @GetMapping("/milk-sales")
  public List<MilkSale> sales() {
    return service.sales().stream()
        .filter(
            x ->
                Access.internal()
                    || Access.identity()[1].equals("ADMIN")
                    || x.farmerId.equals(Long.valueOf(Access.identity()[2])))
        .toList();
  }

  @PostMapping("/milk-sales")
  public MilkSale sell(@Valid @RequestBody Sale r) {
    Access.roles("FARMER");
    Access.farmer(r.farmerId());
    return service.sell(r);
  }

  @GetMapping("/withdrawal-blocks")
  public List<WithdrawalBlock> blocks() {
    return service.blocks().stream()
        .filter(
            x ->
                Access.internal()
                    || Access.identity()[1].equals("ADMIN")
                    || x.farmerId.equals(Long.valueOf(Access.identity()[2])))
        .toList();
  }

  @PostMapping("/withdrawal-blocks")
  public WithdrawalBlock block(@Valid @RequestBody Block r) {
    if (!Access.internal()) throw new SecurityException("Internal service only");
    return service.block(r);
  }

  @GetMapping("/animals/{id}/eligibility")
  public Map<String, Object> eligibility(@PathVariable Long id) {
    return service.eligibility(id);
  }
}
