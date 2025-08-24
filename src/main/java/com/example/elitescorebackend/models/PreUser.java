package com.example.elitescorebackend.models;

public class PreUser {
    private int ID;
    private String username;
    private String email;

    public PreUser(String username,String email) {
        this.email = email;
        this.username = username;
    }

    public PreUser(int ID, String username,String email) {
        this.ID = ID;
        this.email = email;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

}
