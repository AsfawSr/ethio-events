package com.ethioevents.localization;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public record LocalizedDateTimeDto(
        String isoUtc,
        String gregorianFormatted, // "Sat, Oct 10, 2026, 6:00 PM EAT"
        String ethiopianDateFormatted, // "ቅዳሜ ጥቅምት 1, 2019"
        String ethiopianTimeFormatted, // "ምሽት 12:00 ሰዓት"
        String ethiopianFullFormatted // "ቅዳሜ ጥቅምት 1, 2019 (ምሽት 12:00 ሰዓት)"
) {
    public static LocalizedDateTimeDto fromInstant(Instant instant) {
        if (instant == null) return null;

        ZonedDateTime eatTime = instant.atZone(ZoneId.of("Africa/Addis_Ababa"));
        EthiopianDateConverter.EthiopianDate ethDate = EthiopianDateConverter.toEthiopianDate(eatTime.toLocalDate());
        EthiopianTimeConverter.FormattedEthiopianTime ethTime = EthiopianTimeConverter.toEthiopianTime(instant);

        String gregFormatted = eatTime.format(DateTimeFormatter.ofPattern("EEE, MMM d, yyyy, h:mm a 'EAT'"));
        String ethDateStr = ethDate.toString();
        String ethTimeStr = ethTime.fullTimeFormatted();
        String ethFullStr = String.format("%s (%s)", ethDateStr, ethTimeStr);

        return new LocalizedDateTimeDto(
                instant.toString(),
                gregFormatted,
                ethDateStr,
                ethTimeStr,
                ethFullStr
        );
    }
}
