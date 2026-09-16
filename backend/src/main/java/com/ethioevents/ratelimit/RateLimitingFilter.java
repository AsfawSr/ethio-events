package com.ethioevents.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper;

    public RateLimitingFilter(RateLimiterService rateLimiterService, ObjectMapper objectMapper) {
        this.rateLimiterService = rateLimiterService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Check if request matches any rate-limited sensitive route
        RateLimitConfig config = getRateLimitConfig(method, path);

        if (config != null) {
            String clientIp = getClientIp(request);
            String key = config.name + ":" + clientIp;

            RateLimiterService.RateLimitResult result = rateLimiterService.checkRateLimit(
                    key, config.maxRequests, config.windowSeconds);

            response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
            response.setHeader("X-RateLimit-Reset", String.valueOf(result.getResetSeconds()));

            if (!result.isAllowed()) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setHeader("Retry-After", String.valueOf(result.getResetSeconds()));

                Map<String, Object> errorBody = new LinkedHashMap<>();
                errorBody.put("success", false);
                errorBody.put("message", "Too many requests. Please wait a moment before trying again. / በጣም ብዙ ጥያቄዎች ቀርበዋል። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ።");
                errorBody.put("data", null);

                Map<String, Object> errorDetail = new LinkedHashMap<>();
                errorDetail.put("code", "RATE_LIMIT_EXCEEDED");
                errorDetail.put("limit", result.getLimit());
                errorDetail.put("retryAfterSeconds", result.getResetSeconds());
                errorBody.put("error", errorDetail);

                objectMapper.writeValue(response.getOutputStream(), errorBody);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitConfig getRateLimitConfig(String method, String path) {
        if ("POST".equalsIgnoreCase(method)) {
            if (path.startsWith("/api/v1/auth/otp/request")) {
                return new RateLimitConfig("otp_req", 6, 60); // 6 OTP requests per minute
            }
            if (path.startsWith("/api/v1/auth/otp/verify")) {
                return new RateLimitConfig("otp_ver", 10, 60); // 10 verification attempts per minute
            }
            if (path.startsWith("/api/v1/orders/guest-reserve")) {
                return new RateLimitConfig("guest_res", 30, 60); // 30 ticket reservations per minute
            }
            if (path.startsWith("/api/v1/gate/crew/login")) {
                return new RateLimitConfig("crew_login", 10, 60); // 10 PIN attempts per minute
            }
            if (path.startsWith("/api/v1/gate/validate-online")) {
                return new RateLimitConfig("gate_scan", 120, 60); // 120 live scans per minute
            }
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateLimitConfig {
        final String name;
        final int maxRequests;
        final int windowSeconds;

        RateLimitConfig(String name, int maxRequests, int windowSeconds) {
            this.name = name;
            this.maxRequests = maxRequests;
            this.windowSeconds = windowSeconds;
        }
    }
}
