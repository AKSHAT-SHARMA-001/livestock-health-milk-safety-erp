package com.livestock.milk.security;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class SecurityErrors {
  @ExceptionHandler(SecurityException.class)
  @ResponseStatus(HttpStatus.FORBIDDEN)
  public Map<String, String> forbidden(SecurityException e) {
    return Map.of("message", e.getMessage());
  }
}
