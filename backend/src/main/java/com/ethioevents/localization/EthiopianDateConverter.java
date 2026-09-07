package com.ethioevents.localization;

import java.time.LocalDate;

/**
 * Converts between Gregorian and Ethiopian (Ge'ez) Calendars.
 * Ethiopian calendar has 12 months of 30 days plus Pagume (5 or 6 days).
 * New Year (Meskerem 1) corresponds to September 11 (or 12 in leap years).
 */
public class EthiopianDateConverter {

    private static final String[] ETHIOPIAN_MONTHS = {
            "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
            "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጷጉሜን"
    };

    private static final String[] ETHIOPIAN_DAYS_OF_WEEK = {
            "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ", "እሁድ"
    };

    public record EthiopianDate(int year, int month, int day, String monthName, String dayOfWeekName) {
        @Override
        public String toString() {
            return String.format("%s %s %d, %d", dayOfWeekName, monthName, day, year);
        }
    }

    public static EthiopianDate toEthiopianDate(LocalDate date) {
        int gYear = date.getYear();
        int gMonth = date.getMonthValue();
        int gDay = date.getDayOfMonth();

        // Julian Day Number calculation
        int a = (14 - gMonth) / 12;
        int y = gYear + 4800 - a;
        int m = gMonth + 12 * a - 3;
        int jdn = gDay + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045;

        // Convert JDN to Ethiopian Date
        int jdnEra = jdn - 1723856;
        int n = jdnEra % 1461;
        int ethYear = 4 * (jdnEra / 1461) + n / 365;
        if (n == 1460) ethYear--;

        int dayOfYear = jdnEra - (365 * ethYear + ethYear / 4);
        int ethMonth = dayOfYear / 30 + 1;
        int ethDay = dayOfYear % 30 + 1;

        if (ethMonth > 13) {
            ethMonth = 13;
        }

        String monthName = (ethMonth >= 1 && ethMonth <= 13) ? ETHIOPIAN_MONTHS[ethMonth - 1] : "";
        int dayOfWeekIndex = date.getDayOfWeek().getValue() - 1; // 0 for Monday
        String dayOfWeekName = ETHIOPIAN_DAYS_OF_WEEK[dayOfWeekIndex];

        return new EthiopianDate(ethYear, ethMonth, ethDay, monthName, dayOfWeekName);
    }
}
