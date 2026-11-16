package com.livestock.pharmacy.controller;

import com.livestock.pharmacy.dto.Requests.*;
import com.livestock.pharmacy.model.*;
import com.livestock.pharmacy.security.Access;
import com.livestock.pharmacy.service.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "${FRONTEND_ORIGIN:http://localhost:5173}"})
public class InventoryController {
  private final InventoryService service;
  private final JdbcReports reports;

  public InventoryController(InventoryService s, JdbcReports r) {
    service = s;
    reports = r;
  }

  @GetMapping("/medicines")
  public List<Medicine> all() {
    return service.all();
  }

  @GetMapping("/medicines/{id}")
  public Medicine get(@PathVariable Long id) {
    return service.get(id);
  }

  @PostMapping("/medicines")
  public Medicine add(@Valid @RequestBody Item r) {
    Access.roles("ADMIN");
    return service.save(null, r);
  }

  @PutMapping("/medicines/{id}")
  public Medicine update(@PathVariable Long id, @Valid @RequestBody Item r) {
    Access.roles("ADMIN");
    return service.save(id, r);
  }

  @PostMapping("/stock/deduct")
  public StockMovement deduct(@Valid @RequestBody Deduct r) {
    if (!Access.internal()) throw new SecurityException("Internal service only");
    return service.deduct(r);
  }

  @GetMapping("/reports/{name}")
  public List<Map<String, Object>> report(@PathVariable String name) throws java.sql.SQLException {
    Access.roles("ADMIN");
    return reports.run(name);
  }
}
