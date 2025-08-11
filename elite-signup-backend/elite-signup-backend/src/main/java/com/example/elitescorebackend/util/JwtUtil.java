package com.example.elitescorebackend.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Utility class for generating, validating, and managing
 * JSON Web Tokens (JWT) for authentication purposes.
 */
public class JwtUtil {


    private static String base64Key = "12341234123412341234123412341234123412341234";
//    String base64Key = System.getenv("JWT_SIGNING_KEY");
    private static SecretKey SECRET_KEY = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Key));

//    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256); // Use a static key for consistent validation
    public static final long EXPIRATION_TIME_MS = 86400000; // 24 hours
    private static final long LOGIN_EXPIRATION_TIME_MS = 3600000; // 1 hour

    private static final Set<String> revokedTokens = new HashSet<>();


    /**
     * Generates a JWT token for the specified username with a
     * fixed expiration time.
     *
     * @param id the username to include in the token.
     * @return the generated JWT token as a string.
     */
    public static String generateToken(String id) {
        String jti = UUID.randomUUID().toString();
        System.out.println(id);

        return Jwts.builder()
                .setId(jti)
                .setSubject(id)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME_MS))
                .signWith(SECRET_KEY)
                .compact();
    }

    /**
     * Validates the given JWT token's signature and expiration.
     *
     * @param token the JWT token to validate.
     * @return true if the token is valid; false otherwise.
     */
    public static boolean isValid(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(SECRET_KEY).build().parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Extracts the user_id (subject) from the given JWT token.
     *
     * @param token the JWT token.
     * @return the username contained in the token.
     */
    public static String extractUserId(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }
    /**
     * Marks the given JWT token as revoked so it can no longer be used.
     *
     * @param token the JWT token to revoke.
     */
    public static void removeToken(String token) {
        revokedTokens.add(token);
    }

    /**
     * Generates a JWT token for the specified username with a
     * fixed expiration time.
     *
     * @param id the username to include in the token.
     * @return the generated JWT token as a string.
     */
    public static String generateLoginToken(String id) {
        return Jwts.builder()
                .setSubject(id)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + LOGIN_EXPIRATION_TIME_MS))
                .signWith(SECRET_KEY)
                .compact();
    }


    public static String extractJti(String token) {
        // parse claims
        Jws<Claims> parsed = Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token);
        // return the 'jti' claim
        return parsed.getBody().getId();
    }


}
