package com.example.elitescorebackend;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public class RootServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/html;charset=UTF-8");
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write("<html><head><title>EliteScore API</title></head><body>" +
                "<h1>EliteScore API</h1>" +
                "<p>Service is running. See <a href=\"/v1/status\">/v1/status</a> for health.</p>" +
                "</body></html>");
    }
}