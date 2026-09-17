package com.ethioevents.model;

public enum EventCategory {
    ALL("All Categories", "ሁሉም መድረኮች", "✨"),
    MUSIC_CONCERT("Concerts & Live Music", "ኮንሰርት እና ሙዚቃ", "🎵"),
    TECH_SUMMIT("Tech, AI & Startups", "ቴክኖሎጂ እና AI", "💻"),
    CULTURE_FESTIVAL("Culture, Buna & Food", "ባህል እና ቡና", "☕"),
    COMEDY_THEATRE("Comedy, Theatre & Jazz", "ኮሜዲ እና ቴአትር", "🎭"),
    SPORTS_FITNESS("Sports, 10K & Marathon", "ስፖርት እና ማራቶን", "🏃"),
    NIGHTLIFE_PARTY("Nightlife & DJ Sets", "የምሽት ፕሮግራም", "🌙"),
    ART_EXHIBITION("Art & Photography Expo", "ኪነ-ጥበብ እና ኤግዚቢሽን", "🎨"),
    BUSINESS_EXPO("Business & Trade Expo", "የንግድ ትርዒት", "💼"),
    OTHER("Special Events", "ልዩ ዝግጅት", "🎟️");

    private final String englishName;
    private final String amharicName;
    private final String iconEmoji;

    EventCategory(String englishName, String amharicName, String iconEmoji) {
        this.englishName = englishName;
        this.amharicName = amharicName;
        this.iconEmoji = iconEmoji;
    }

    public String getEnglishName() { return englishName; }
    public String getAmharicName() { return amharicName; }
    public String getIconEmoji() { return iconEmoji; }
}
