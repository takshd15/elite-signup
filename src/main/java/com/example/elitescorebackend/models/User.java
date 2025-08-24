package com.example.elitescorebackend.models;


import com.example.elitescorebackend.models.enums.UserRole;

public class User {
    private int ID;
    private String username;
    private String passwordHash;
    private UserRole role;
    private String email;

    public User(String username,String passwordHash,UserRole role,String email) {
        this.email = email;
        this.role = role;
        this.passwordHash = passwordHash;
        this.username = username;
    }

    public User(int ID, String username,String passwordHash, UserRole role,String email) {
        this.ID = ID;
        this.email = email;
        this.role = role;
        this.passwordHash = passwordHash;
        this.username = username;
    }

    public int getID() {
        return ID;
    }

    public void setID(int ID) {
        this.ID = ID;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

}
