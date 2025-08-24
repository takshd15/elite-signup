package com.example.elitescorebackend.models.enums;

public enum UserRole {
    PAID,
    FREE;

    public static UserRole fromLabel(String label) {
        if (label == null) {
            throw new IllegalArgumentException("Label must not be null");
        }
        switch (label.trim().toUpperCase()) {
            case "PAID":
                return PAID;
            case "FREE":
                return FREE;
            default:
                throw new IllegalArgumentException("Unknown user role label: " + label);
        }
    }

    @Override
    public String toString() {
        return this.name();
    }
}
