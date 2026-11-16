package com.livestock.vet.controller;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
/** Readiness is served only after Spring and JPA initialize successfully. */
@RestController public class HealthController {
 @GetMapping("/api/health") public Map<String,String> health(){return Map.of("status","UP","service","vet-service");}
}

