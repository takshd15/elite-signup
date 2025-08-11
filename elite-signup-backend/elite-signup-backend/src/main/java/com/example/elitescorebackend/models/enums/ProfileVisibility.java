package com.example.elitescorebackend.models.enums;

public enum ProfileVisibility {
    PUBLIC,
    PRIVATE;

    /**
     * Converts a string to the corresponding ProfileVisibility enum,
     * matching case-insensitively. Throws IllegalArgumentException if no match.
     */
    public static ProfileVisibility fromString(String value) {
        if (value == null) {
            throw new IllegalArgumentException("ProfileVisibility value cannot be null");
        }
        switch (value.trim().toLowerCase()) {
            case "public":
                return PUBLIC;
            case "private":
                return PRIVATE;
            default:
                throw new IllegalArgumentException(
                        "Unknown ProfileVisibility: " + value);
        }
    }
}
