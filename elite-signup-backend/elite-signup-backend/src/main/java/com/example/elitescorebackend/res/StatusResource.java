package com.example.elitescorebackend.res;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDate;

@Path("/status")
public class StatusResource {
    @GET
    @Produces(MediaType.TEXT_HTML)
    public String status() {
        return "<h1>Api running (" + LocalDate.now() + ")</h1>";
    }
}