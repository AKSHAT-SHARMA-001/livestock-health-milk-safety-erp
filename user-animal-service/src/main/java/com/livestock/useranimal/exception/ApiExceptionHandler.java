package com.livestock.useranimal.exception;

import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

/** Unit 4: one place for friendly API error responses. */
@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  Map<String, String> conflict(Exception ex) {
    return Map.of("message", "This value is already used, or this record is still referenced.");
  }
  @ExceptionHandler(ResourceNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  Map<String, String> notFound(ResourceNotFoundException ex) {
    return Map.of("message", ex.getMessage());
  }

  @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  Map<String, String> badRequest(Exception ex) {
    return Map.of(
        "message",
        ex instanceof MethodArgumentNotValidException
            ? "Please provide all required fields correctly."
            : ex.getMessage());
  }
}
