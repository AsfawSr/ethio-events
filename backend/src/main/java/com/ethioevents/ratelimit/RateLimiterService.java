package com.ethioevents.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);

    private final StringRedisTemplate redisTemplate;
    private final Map<String, InMemoryBucket> inMemoryBuckets = new ConcurrentHashMap<>();

    @Autowired(required = false)
    public RateLimiterService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public static class RateLimitResult {
        private final boolean allowed;
        private final int limit;
        private final int remaining;
        private final long resetSeconds;

        public RateLimitResult(boolean allowed, int limit, int remaining, long resetSeconds) {
            this.allowed = allowed;
            this.limit = limit;
            this.remaining = remaining;
            this.resetSeconds = resetSeconds;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public int getLimit() {
            return limit;
        }

        public int getRemaining() {
            return remaining;
        }

        public long getResetSeconds() {
            return resetSeconds;
        }
    }

    private static class InMemoryBucket {
        final AtomicInteger count = new AtomicInteger(0);
        final long expiresAtMillis;

        InMemoryBucket(long expiresAtMillis) {
            this.expiresAtMillis = expiresAtMillis;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }

    /**
     * Check if a request is allowed within the rate limit window.
     * Tries Redis first; falls back gracefully to high-performance ConcurrentHashMap.
     */
    public RateLimitResult checkRateLimit(String key, int maxRequests, int windowSeconds) {
        if (redisTemplate != null) {
            try {
                return checkRedisRateLimit(key, maxRequests, windowSeconds);
            } catch (Exception e) {
                log.debug("Redis rate limiting unavailable ({}), falling back to in-memory: {}", e.getClass().getSimpleName(), e.getMessage());
            }
        }
        return checkInMemoryRateLimit(key, maxRequests, windowSeconds);
    }

    private RateLimitResult checkRedisRateLimit(String key, int maxRequests, int windowSeconds) {
        String redisKey = "ethioevents:ratelimit:" + key;
        Long currentCount = redisTemplate.opsForValue().increment(redisKey);
        
        if (currentCount != null && currentCount == 1) {
            redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
        }

        Long ttl = redisTemplate.getExpire(redisKey, TimeUnit.SECONDS);
        long resetSeconds = (ttl != null && ttl > 0) ? ttl : windowSeconds;

        int current = currentCount != null ? currentCount.intValue() : 1;
        boolean allowed = current <= maxRequests;
        int remaining = Math.max(0, maxRequests - current);

        return new RateLimitResult(allowed, maxRequests, remaining, resetSeconds);
    }

    private RateLimitResult checkInMemoryRateLimit(String key, int maxRequests, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowMillis = windowSeconds * 1000L;

        InMemoryBucket bucket = inMemoryBuckets.compute(key, (k, existing) -> {
            if (existing == null || existing.isExpired()) {
                InMemoryBucket newBucket = new InMemoryBucket(now + windowMillis);
                newBucket.count.incrementAndGet();
                return newBucket;
            }
            existing.count.incrementAndGet();
            return existing;
        });

        int current = bucket.count.get();
        boolean allowed = current <= maxRequests;
        int remaining = Math.max(0, maxRequests - current);
        long resetSeconds = Math.max(1, (bucket.expiresAtMillis - now) / 1000L);

        // Periodic light cleanup
        if (inMemoryBuckets.size() > 5000) {
            inMemoryBuckets.entrySet().removeIf(entry -> entry.getValue().isExpired());
        }

        return new RateLimitResult(allowed, maxRequests, remaining, resetSeconds);
    }
}
