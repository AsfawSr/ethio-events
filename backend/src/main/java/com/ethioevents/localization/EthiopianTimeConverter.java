package com.ethioevents.localization;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class EthiopianTimeConverter {

    public static final ZoneId ADDIS_ABABA_ZONE = ZoneId.of("Africa/Addis_Ababa"); // UTC+3

    public record FormattedEthiopianTime(
            int ethiopianHour,
            int minute,
            String periodName, // ጠዋት, ከሰዓት, ዋዜማ, ምሽት, እኩለ ሌሊት
            String fullTimeFormatted, // e.g. "ምሽት 2:30 ሰዓት"
            String eatTimeFormatted // e.g. "8:30 PM EAT"
    ) {}

    public static FormattedEthiopianTime toEthiopianTime(Instant utcInstant) {
        ZonedDateTime eatDateTime = utcInstant.atZone(ADDIS_ABABA_ZONE);
        int eatHour = eatDateTime.getHour();
        int minute = eatDateTime.getMinute();

        // Formula: (EAT Hour + 6) % 12, where 0 becomes 12
        int ethHour = (eatHour + 6) % 12;
        if (ethHour == 0) {
            ethHour = 12;
        }

        String period;
        if (eatHour >= 6 && eatHour < 12) {
            period = "ጠዋት"; // Morning (6:00 AM - 11:59 AM)
        } else if (eatHour >= 12 && eatHour < 17) {
            period = "ከሰዓት"; // Afternoon (12:00 PM - 4:59 PM)
        } else if (eatHour >= 17 && eatHour < 19) {
            period = "ዋዜማ"; // Late afternoon / Dusk (5:00 PM - 6:59 PM)
        } else if (eatHour >= 19 && eatHour <= 23) {
            period = "ምሽት"; // Night (7:00 PM - 11:59 PM)
        } else {
            period = "እኩለ ሌሊት"; // Midnight / Dawn (12:00 AM - 5:59 AM)
        }

        String ethFormatted = String.format("%s %d:%02d ሰዓት", period, ethHour, minute);
        String eatFormatted = eatDateTime.format(DateTimeFormatter.ofPattern("h:mm a 'EAT'"));

        return new FormattedEthiopianTime(ethHour, minute, period, ethFormatted, eatFormatted);
    }
}
