package com.example.elitescorebackend;

import org.glassfish.jersey.server.ResourceConfig;
import jakarta.ws.rs.ApplicationPath;

@ApplicationPath("/v1")
public class AppConfig extends ResourceConfig {
    public AppConfig() {
        packages("com.example.elitescorebackend");
        register(org.glassfish.jersey.jackson.JacksonFeature.class);
        register(com.example.elitescorebackend.util.JacksonConfig.class);
    }
}
