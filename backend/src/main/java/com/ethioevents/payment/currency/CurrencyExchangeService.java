package com.ethioevents.payment.currency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CurrencyExchangeService {

    private static final Logger log = LoggerFactory.getLogger(CurrencyExchangeService.class);

    // ETB per 1 unit of foreign currency
    private final Map<String, CurrencyInfo> rateMap = new LinkedHashMap<>();

    public record CurrencyInfo(
            String code,
            String name,
            String symbol,
            String flag,
            BigDecimal etbRate // How many ETB equals 1 unit of this currency
    ) {}

    public record ExchangeRatesResponse(
            String baseCurrency,
            Instant lastUpdated,
            List<CurrencyInfo> currencies
    ) {}

    public CurrencyExchangeService() {
        // Initial Ethiopian Commercial / National Bank of Ethiopia benchmark rates
        rateMap.put("ETB", new CurrencyInfo("ETB", "Ethiopian Birr", "ETB", "🇪🇹", BigDecimal.ONE));
        rateMap.put("USD", new CurrencyInfo("USD", "US Dollar", "$", "🇺🇸", new BigDecimal("125.0000")));
        rateMap.put("EUR", new CurrencyInfo("EUR", "Euro", "€", "🇪🇺", new BigDecimal("138.0000")));
        rateMap.put("GBP", new CurrencyInfo("GBP", "British Pound", "£", "🇬🇧", new BigDecimal("163.0000")));
        rateMap.put("CAD", new CurrencyInfo("CAD", "Canadian Dollar", "CA$", "🇨🇦", new BigDecimal("92.5000")));
        rateMap.put("AED", new CurrencyInfo("AED", "UAE Dirham", "AED", "🇦🇪", new BigDecimal("34.0000")));
        log.info("Initialized CurrencyExchangeService with {} diaspora currencies", rateMap.size());
    }

    public ExchangeRatesResponse getExchangeRates() {
        return new ExchangeRatesResponse(
                "ETB",
                Instant.now(),
                List.copyOf(rateMap.values())
        );
    }

    public BigDecimal getExchangeRate(String currency) {
        if (currency == null || currency.isBlank()) return BigDecimal.ONE;
        CurrencyInfo info = rateMap.get(currency.toUpperCase());
        return info != null ? info.etbRate() : BigDecimal.ONE;
    }

    public BigDecimal convertEtbToForeign(BigDecimal etbAmount, String targetCurrency) {
        if (etbAmount == null) return BigDecimal.ZERO;
        if (targetCurrency == null || "ETB".equalsIgnoreCase(targetCurrency.trim())) {
            return etbAmount.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal rate = getExchangeRate(targetCurrency);
        if (rate.compareTo(BigDecimal.ZERO) <= 0) return etbAmount;

        // Foreign = ETB / rate
        return etbAmount.divide(rate, 2, RoundingMode.HALF_UP);
    }

    public BigDecimal convertForeignToEtb(BigDecimal foreignAmount, String foreignCurrency) {
        if (foreignAmount == null) return BigDecimal.ZERO;
        if (foreignCurrency == null || "ETB".equalsIgnoreCase(foreignCurrency.trim())) {
            return foreignAmount.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal rate = getExchangeRate(foreignCurrency);
        // ETB = Foreign * rate
        return foreignAmount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    public boolean isSupported(String currency) {
        return currency != null && rateMap.containsKey(currency.toUpperCase());
    }
}
