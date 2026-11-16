package com.livestock.useranimal.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Unit 4/5: small signed bearer token shared by the four services; HMAC prevents role tampering.
 */
@Component
public class Access extends OncePerRequestFilter {
  private static final String SECRET =
      System.getenv().getOrDefault("AUTH_SECRET", "academic-local-demo-change-this-secret");

  public static String serviceKey() {
    return System.getenv().getOrDefault("SERVICE_KEY", "academic-local-service-key");
  }

  private static String sign(String value) {
    try {
      Mac m = Mac.getInstance("HmacSHA256");
      m.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(m.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException("Token signing failed");
    }
  }

  public static String token(Long id, String role, Long farmer) {
    String s =
        id
            + ":"
            + role
            + ":"
            + (farmer == null ? 0 : farmer)
            + ":"
            + Instant.now().plusSeconds(28800).getEpochSecond();
    String p =
        Base64.getUrlEncoder().withoutPadding().encodeToString(s.getBytes(StandardCharsets.UTF_8));
    return p + "." + sign(p);
  }

  public static String[] identity() {
    HttpServletRequest r =
        ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    return (String[]) r.getAttribute("identity");
  }

  public static boolean internal() {
    return "INTERNAL".equals(identity()[1]);
  }

  public static Long userId() {
    return Long.valueOf(identity()[0]);
  }

  public static void roles(String... roles) {
    if (!internal() && !Arrays.asList(roles).contains(identity()[1]))
      throw new SecurityException("Role not permitted");
  }

  public static void farmer(Long id) {
    if (!internal()
        && !"ADMIN".equals(identity()[1])
        && (!"FARMER".equals(identity()[1]) || !Long.valueOf(identity()[2]).equals(id)))
      throw new SecurityException("Farmer ownership required");
  }

  public static void vet(Long id) {
    if (!internal()
        && !"ADMIN".equals(identity()[1])
        && (!"VET".equals(identity()[1]) || !userId().equals(id)))
      throw new SecurityException("Vet ownership required");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest r, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String origin = r.getHeader("Origin");
    if (origin != null) {
      if (!origin.equals("http://localhost:5173") && !origin.equals(System.getenv().getOrDefault("FRONTEND_ORIGIN", "http://localhost:5173"))) {
        response.setStatus(403);
        return;
      }
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }
    response.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (r.getMethod().equals("OPTIONS")) {
      response.setStatus(204);
      return;
    }
    if (r.getRequestURI().equals("/api/health") || r.getRequestURI().startsWith("/api/auth/")) {
      chain.doFilter(r, response);
      return;
    }
    try {
      if (MessageDigest.isEqual(
          serviceKey().getBytes(StandardCharsets.UTF_8),
          Optional.ofNullable(r.getHeader("X-Service-Key"))
              .orElse("")
              .getBytes(StandardCharsets.UTF_8)))
        r.setAttribute("identity", new String[] {"0", "INTERNAL", "0"});
      else {
        String h = r.getHeader("Authorization");
        if (h == null || !h.startsWith("Bearer ")) throw new IllegalArgumentException();
        String[] t = h.substring(7).split("\\.");
        if (t.length != 2
            || !MessageDigest.isEqual(
                sign(t[0]).getBytes(StandardCharsets.UTF_8), t[1].getBytes(StandardCharsets.UTF_8)))
          throw new IllegalArgumentException();
        String[] v =
            new String(Base64.getUrlDecoder().decode(t[0]), StandardCharsets.UTF_8).split(":");
        if (v.length != 4 || Long.parseLong(v[3]) < Instant.now().getEpochSecond())
          throw new IllegalArgumentException();
        r.setAttribute("identity", v);
      }
    } catch (Exception e) {
      response.setStatus(401);
      response.setContentType("application/json");
      response.getWriter().write("{\"message\":\"Sign in again; valid bearer token required.\"}");
      return;
    }
    chain.doFilter(r, response);
  }
}
