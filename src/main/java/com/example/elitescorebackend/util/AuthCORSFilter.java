package com.example.elitescorebackend.util;

import com.example.elitescorebackend.handlers.TokenRevocationHandler;
import com.example.elitescorebackend.handlers.VerificationCodeHandler;
import com.example.elitescorebackend.models.VerificationCode;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

import static com.example.elitescorebackend.util.JwtUtil.isValid;


/**
 * Servlet filter that handles Cross-Origin Resource Sharing (CORS),
 * preflight requests, JWT-based authentication, and input sanitisation.
 * <p>
 * This filter adds standard CORS headers to responses,
 * allows preflight OPTIONS requests, verifies JWT tokens
 * for protected endpoints, and wraps incoming requests
 * with a sanitizer to help prevent XSS or injection attacks.
 */
@WebFilter("/*")
public class AuthCORSFilter implements Filter {

    @Override
    /**
     * Initializes the filter. No custom initialization is needed.
     *
     * @param filterConfig the filter configuration.
     */
    public void init(FilterConfig filterConfig) { /* no-op */ }

    /**
     * Cleans up resources used by the filter. No custom cleanup is needed.
     */
    @Override
    public void destroy() { /* no-op */ }

    /**
     * Processes incoming requests:
     * <ul>
     *   <li>Adds CORS headers to the response</li>
     *   <li>Handles preflight OPTIONS requests</li>
     *   <li>Allows unauthenticated requests for login and registration endpoints</li>
     *   <li>Validates JWT tokens for protected endpoints</li>
     *   <li>Wraps the request with {@code SanitizedRequest} to filter input</li>
     * </ul>
     *
     * @param req   the {@link ServletRequest}
     * @param res   the {@link ServletResponse}
     * @param chain the {@link FilterChain} to continue processing
     * @throws IOException      if an I/O error occurs
     * @throws ServletException if a servlet error occurs
     */
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        String path = request.getRequestURI();

        // 1) Add CORS headers
        String origin = request.getHeader("Origin");
        if (origin != null) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        }
        response.setHeader("Vary", "Origin");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, Origin");
        response.setHeader("Access-Control-Max-Age", "3600");

        // 2) Preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            ip = ip.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }
        // store on the request
        request.setAttribute("clientIp", ip);

        //  3) If the path does NOT start with /v1 -> allow without token
        if (!path.startsWith(request.getContextPath() + "/v1") ) {
            chain.doFilter(new SanitizedRequest(request), res);
            return;
        }

        if(path.startsWith(request.getContextPath() + "/v1/status")) {
            chain.doFilter(new SanitizedRequest(request), res);
            return;
        }

        // 4. Allow unauthenticated login and register under /v1
        if (path.contains("/v1/auth")
                && !path.contains("/v1/auth/logout")
                && !path.contains("/v1/auth/verify")
                && !path.contains("/v1/auth/resend") ) {
            System.out.println(path);
            chain.doFilter(new SanitizedRequest(request), res);
            return;
        }

        // 5) Extract token
        String authHeader = request.getHeader("Authorization");
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring("Bearer ".length());
        }

        // 6) Validate JWT
        String id = JwtUtil.extractUserId(token);
        String jti = JwtUtil.extractJti(token);
        if (token != null && isValid(token) && !TokenRevocationHandler.getInstance().isRevoked(jti)) {
            request.setAttribute("userId", id);

            if (!hasValidatedLatestCode(Integer.parseInt(id), ip)
                    && !path.contains("/v1/auth/resend")
                    && !path.contains("/v1/auth/verify")) {
                response.sendError(
                        HttpServletResponse.SC_FORBIDDEN,
                        "Access denied: you must verify your latest code before proceeding."
                );
                return;
            }

            chain.doFilter(new SanitizedRequest(request), res);
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized: invalid or missing token\"}");
            return;
        }

    }

    /**
     * Returns true if the user’s most recently issued VerificationCode
     * was:
     * 1) actually used,
     * 2) still within its 15-minute window, and
     * 3) created from the same IP as the current request.
     */
    private boolean hasValidatedLatestCode(int userId, String requestIp) {
        VerificationCodeHandler handler = VerificationCodeHandler.getInstance();
        VerificationCode latest = handler.getLatestCodeForUser(userId);
        if (latest == null) {
            return false;
        }

        Instant now = Instant.now();
        // expiration is based on when it was created
        boolean stillValid = now.isBefore(
                latest.getCreated_at().plus(Duration.ofMinutes(15))
        );

        boolean ipMatches = requestIp.equals(latest.getRequest_ip());

        return latest.isUsed() && stillValid && ipMatches;
    }



    /**
     * HttpServletRequest wrapper that sanitizes all incoming
     * parameters and headers to help mitigate XSS and injection attacks.
     * <p>
     * Overrides {@code getParameter}, {@code getParameterValues},
     * and {@code getHeader} to apply a basic sanitization routine.
     */
    private static class SanitizedRequest extends HttpServletRequestWrapper {
        public SanitizedRequest(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return sanitize(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) return null;
            String[] sanitized = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                sanitized[i] = sanitize(values[i]);
            }
            return sanitized;
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            return sanitize(value);
        }

        /**
         * Performs basic sanitization by removing potentially dangerous characters
         * such as angle brackets and quotes, and replacing ampersands.
         *
         * @param input the raw input string
         * @return a sanitized version of the input
         */
        private String sanitize(String input) {
            if (input == null) return null;

            // Strip script tags
            String clean = input.replaceAll("(?i)<script.*?>.*?</script.*?>", "");

            // Remove control chars
            clean = clean.replaceAll("\\p{C}", "");

            // Remove CRLF tabs
            clean = clean.replaceAll("[\\r\\n\\t]", "");

            // Escape HTML
            clean = clean.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;");

            return clean.trim();
        }
    }
}
