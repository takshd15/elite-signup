package com.example.elitescorebackend.models;

import java.time.Instant;
import java.time.LocalTime;

public class VerificationCode {
    private int  code;
    private int user_id;
    private Instant created_at;
    private Instant expiration_date;
    boolean used;
    private String request_ip;

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public int getUser_id() {
        return user_id;
    }

    public void setUser_id(int user_id) {
        this.user_id = user_id;
    }

    public Instant getCreated_at() {
        return created_at;
    }

    public void setCreated_at(Instant created_at) {
        this.created_at = created_at;
    }

    public Instant getExpiration_date() {
        return expiration_date;
    }

    public void setExpiration_date(Instant expiration_date) {
        this.expiration_date = expiration_date;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }

    public String getRequest_ip() {
        return request_ip;
    }

    public void setRequest_ip(String request_ip) {
        this.request_ip = request_ip;
    }

}
