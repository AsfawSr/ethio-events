package com.ethioevents.localization;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class LocalizationConverterTest {

    @Test
    void testEthiopianDateConversion() {
        // Sep 11, 2026 is Meskerem 1, 2019 (Ethiopian New Year)
        LocalDate date = LocalDate.of(2026, 9, 11);
        EthiopianDateConverter.EthiopianDate ethDate = EthiopianDateConverter.toEthiopianDate(date);

        assertEquals(2019, ethDate.year());
        assertEquals(1, ethDate.month());
        assertEquals(1, ethDate.day());
        assertEquals("መስከረም", ethDate.monthName());
    }

    @Test
    void testEthiopian12HourCycle() {
        // 15:00 UTC = 18:00 EAT (6:00 PM) -> 12:00 in Ethiopian time (ምሽት 12:00 ሰዓት)
        Instant evening = Instant.parse("2026-10-10T15:00:00Z");
        EthiopianTimeConverter.FormattedEthiopianTime ethTime = EthiopianTimeConverter.toEthiopianTime(evening);

        assertEquals(12, ethTime.ethiopianHour());
        assertEquals(0, ethTime.minute());
        assertEquals("ዋዜማ", ethTime.periodName());

        // 17:00 UTC = 20:00 EAT (8:00 PM) -> 2:00 in Ethiopian time (ምሽት 2:00 ሰዓት)
        Instant night = Instant.parse("2026-10-10T17:00:00Z");
        EthiopianTimeConverter.FormattedEthiopianTime ethTimeNight = EthiopianTimeConverter.toEthiopianTime(night);

        assertEquals(2, ethTimeNight.ethiopianHour());
        assertEquals(0, ethTimeNight.minute());
        assertEquals("ምሽት", ethTimeNight.periodName());
        assertEquals("ምሽት 2:00 ሰዓት", ethTimeNight.fullTimeFormatted());
    }

    @Test
    void testLocalizedDateTimeDto() {
        Instant instant = Instant.parse("2026-10-10T15:30:00Z");
        LocalizedDateTimeDto dto = LocalizedDateTimeDto.fromInstant(instant);

        assertNotNull(dto);
        assertNotNull(dto.gregorianFormatted());
        assertNotNull(dto.ethiopianDateFormatted());
        assertNotNull(dto.ethiopianTimeFormatted());
        assertTrue(dto.ethiopianTimeFormatted().contains("ሰዓት"));
    }
}
