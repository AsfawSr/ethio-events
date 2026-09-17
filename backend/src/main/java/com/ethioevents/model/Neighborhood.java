package com.ethioevents.model;

public enum Neighborhood {
    ALL("All Addis Ababa", "መላው አዲስ አበባ"),
    BOLE("Bole (ቦሌ)", "ቦሌ"),
    KAZANCHIS("Kazanchis (ካዛንቺስ)", "ካዛንቺስ"),
    SARBET("Sarbet / Old Airport (ሳርቤት)", "ሳርቤት"),
    PIASSA("Piassa / Arada (ፒያሳ)", "ፒያሳ"),
    MESKEL_SQUARE("Meskel Square (መስቀል አደባባይ)", "መስቀል አደባባይ"),
    MEXICO("Mexico / Stadium (ሜክሲኮ)", "ሜክሲኮ"),
    ENTOTO("Entoto Hills (እንጦጦ)", "እንጦጦ"),
    CMC("CMC / Ayat (ሲኤምሲ)", "ሲኤምሲ"),
    GERJI("Gerji / Imperial (ገርጂ)", "ገርጂ"),
    BISHOFTU("Bishoftu / Kuriftu (ቢሾፍቱ)", "ቢሾፍቱ"),
    HAWASSA("Hawassa Lake (ሐዋሳ)", "ሐዋሳ"),
    OTHER("Other Locations", "ሌሎች አካባቢዎች");

    private final String englishName;
    private final String amharicName;

    Neighborhood(String englishName, String amharicName) {
        this.englishName = englishName;
        this.amharicName = amharicName;
    }

    public String getEnglishName() { return englishName; }
    public String getAmharicName() { return amharicName; }
}
