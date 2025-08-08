package com.example.elitescorebackend;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.glassfish.jersey.servlet.ServletContainer;
import org.glassfish.jersey.server.ResourceConfig;
import jakarta.servlet.DispatcherType;
import org.eclipse.jetty.servlet.FilterHolder;

import java.util.EnumSet;

public class Main {
    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8081"));

        ResourceConfig config = new ResourceConfig()
            .packages("com.example.elitescorebackend.res")
            .register(com.example.elitescorebackend.util.JacksonConfig.class);

        ServletContainer servletContainer = new ServletContainer(config);
        ServletContextHandler ctx = new ServletContextHandler(ServletContextHandler.NO_SESSIONS);
        ctx.setContextPath("/");
        ctx.addServlet(new org.eclipse.jetty.servlet.ServletHolder(new RootServlet()), "/*");
        ctx.addServlet(new org.eclipse.jetty.servlet.ServletHolder(servletContainer), "/v1/*");

        // Register CORS/Auth filter for all requests
        FilterHolder corsAuthFilter = new FilterHolder(new com.example.elitescorebackend.util.AuthCORSFilter());
        ctx.addFilter(corsAuthFilter, "/*", EnumSet.of(DispatcherType.REQUEST, DispatcherType.FORWARD, DispatcherType.ERROR));

        Server server = new Server(port);
        server.setHandler(ctx);
        server.start();
        server.join();
    }
}
