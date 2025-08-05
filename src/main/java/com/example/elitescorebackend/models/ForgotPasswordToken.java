package com.example.elitescorebackend.models;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class ForgotPasswordToken {
    private int id;
    private int userId;
    private String token;
    private String expirationDate;

    public ForgotPasswordToken(int id, int userId, String token, String expirationDate) {
        this.id = id;
        this.userId = userId;
        this.token = token;
        this.expirationDate = expirationDate;
    }

    public ForgotPasswordToken(int userId, String token, String expirationDate) {
        this.userId = userId;
        this.token = token;
        this.expirationDate = expirationDate;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getExpirationDate() { return expirationDate; }
    public void setExpirationDate(String expirationDate) { this.expirationDate = expirationDate; }

    public boolean isExpired() {
        if (expirationDate == null) return true;

        try {
            // Example pattern: adjust if your DB timestamp string looks different
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            LocalDateTime exp = LocalDateTime.parse(expirationDate, formatter);
            LocalDateTime now = LocalDateTime.now();
            Duration diff = Duration.between(exp, now);
            return diff.toHours() >= 1;
        } catch (DateTimeParseException e) {
            e.printStackTrace();
            return true;
        }
    }
}
