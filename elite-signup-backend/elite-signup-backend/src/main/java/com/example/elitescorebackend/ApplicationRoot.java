package com.example.elitescorebackend;

import com.example.elitescorebackend.util.AuthCORSFilter;
import jakarta.ws.rs.ApplicationPath;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.jackson.JacksonFeature;

@ApplicationPath("/v1")
    public class ApplicationRoot extends ResourceConfig {
        public ApplicationRoot() {
            // scan all your resource packages
            packages("com.example.elitescorebackend");
            // register any custom providers/filters explicitly
            register(com.example.elitescorebackend.util.JacksonConfig.class);
            register(AuthCORSFilter.class);
            // Enable JSON (Jackson) support explicitly to ensure @Consumes(MediaType.APPLICATION_JSON) works
            register(JacksonFeature.class);
        }
    }