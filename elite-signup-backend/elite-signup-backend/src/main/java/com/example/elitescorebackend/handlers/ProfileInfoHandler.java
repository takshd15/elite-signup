package com.example.elitescorebackend.handlers;

import com.example.elitescorebackend.models.ProfileInfo;
import com.example.elitescorebackend.models.enums.ProfileVisibility;
import com.example.elitescorebackend.util.DatabaseConnection;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.sql.*;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class ProfileInfoHandler {

    private static ProfileInfoHandler instance;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private ProfileInfoHandler() { }

    public static ProfileInfoHandler getInstance() {
        if (instance == null) {
            instance = new ProfileInfoHandler();
        }
        return instance;
    }

    /**
     * Inserts a new user_profile_info row for the given ProfileInfo.
     */
    public void createProfile(ProfileInfo profile) {
        String sql = """
            INSERT INTO user_profile_info (
              user_id_serial, phone_number, first_name, last_name,
              bio, resume, growth_score, xp_points,
              achievements, active_challenge, challenges_completed,
             visibility,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?, ?)
            """;

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            bindProfile(ps, profile);
            ps.executeUpdate();
            conn.commit();

        } catch (SQLException e) {
            e.printStackTrace();
            rollbackQuietly();
        }
    }

    /**
     * Updates all non-null fields on an existing profile row.
     */
    public void updateProfile(ProfileInfo profile) {
        // Build a dynamic SQL SET clause based on which fields are non-null
        StringBuilder sb = new StringBuilder("UPDATE user_profile_info SET ");
        boolean first = true;

        if (profile.getPhoneNumber() != null)          { append(sb, first, "phone_number = ?"); first = false; }
        if (profile.getFirstName() != null)            { append(sb, first, "first_name = ?"); first = false; }
        if (profile.getLastName() != null)             { append(sb, first, "last_name = ?"); first = false; }
        if (profile.getBio() != null)                  { append(sb, first, "bio = ?"); first = false; }
        if (profile.getResume() != null)               { append(sb, first, "resume = ?"); first = false; }
        if (profile.getGrowthScore() != null)          { append(sb, first, "growth_score = ?"); first = false; }
        if (profile.getXpPoints() != null)             { append(sb, first, "xp_points = ?"); first = false; }
        if (profile.getAchievements() != null)         { append(sb, first, "achievements = ?::jsonb"); first = false; }
        if (profile.getActiveChallenge() != null)      { append(sb, first, "active_challenge = ?"); first = false; }
        if (profile.getChallengesCompleted() != null)  { append(sb, first, "challenges_completed = ?"); first = false; }
        if (profile.getFollowersCount() != null)       { append(sb, first, "followers_count = ?"); first = false; }
        if (profile.getFollowingCount() != null)       { append(sb, first, "following_count = ?"); first = false; }
        if (profile.getVisibility() != null)           { append(sb, first, "visibility = ?"); first = false; }

        // always bump updated_at
        append(sb, first, "updated_at = ?");
        sb.append(" WHERE user_id_serial = ?");

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sb.toString())) {

            int idx = 1;
            if (profile.getPhoneNumber() != null)          ps.setString(idx++, profile.getPhoneNumber());
            if (profile.getFirstName() != null)            ps.setString(idx++, profile.getFirstName());
            if (profile.getLastName() != null)             ps.setString(idx++, profile.getLastName());
            if (profile.getBio() != null)                  ps.setString(idx++, profile.getBio());
            if (profile.getResume() != null)               ps.setString(idx++, profile.getResume());
            if (profile.getGrowthScore() != null)          ps.setInt(idx++, profile.getGrowthScore());
            if (profile.getXpPoints() != null)             ps.setInt(idx++, profile.getXpPoints());
            if (profile.getAchievements() != null)         ps.setString(idx++, toJson(profile.getAchievements()));
            if (profile.getActiveChallenge() != null)      ps.setInt(idx++, profile.getActiveChallenge());
            if (profile.getChallengesCompleted() != null)  ps.setInt(idx++, profile.getChallengesCompleted());
            if (profile.getFollowersCount() != null)       ps.setInt(idx++, profile.getFollowersCount());
            if (profile.getFollowingCount() != null)       ps.setInt(idx++, profile.getFollowingCount());
            if (profile.getVisibility() != null)           ps.setString(idx++, profile.getVisibility().name());

            ps.setTimestamp(idx++, Timestamp.from(Instant.now()));
            ps.setLong(idx, profile.getUserId());

            ps.executeUpdate();
            conn.commit();

        } catch (SQLException e) {
            e.printStackTrace();
            rollbackQuietly();
        }
    }

    /**
     * Deletes the user_profile_info row for the given userId.
     */
    public void deleteProfile(long userId) {
        String sql = "DELETE FROM user_profile_info WHERE user_id_serial = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, userId);
            ps.executeUpdate();
            conn.commit();

        } catch (SQLException e) {
            e.printStackTrace();
            rollbackQuietly();
        }
    }

    /**
     * Retrieves ProfileInfo by userId, or null if not found.
     */
    public ProfileInfo getProfile(long userId) {
        String sql = "SELECT * FROM user_profile_info WHERE user_id_serial = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                ProfileInfo p = new ProfileInfo();
                p.setUserId(rs.getLong("user_id_serial"));
                p.setPhoneNumber(rs.getString("phone_number"));
                p.setFirstName(rs.getString("first_name"));
                p.setLastName(rs.getString("last_name"));
                p.setBio(rs.getString("bio"));
                p.setResume(rs.getString("resume"));
                p.setGrowthScore(rs.getInt("growth_score"));
                p.setXpPoints(rs.getInt("xp_points"));

                String json = rs.getString("achievements");
                List<String> list = json != null
                    ? Arrays.asList(objectMapper.readValue(json, String[].class))
                    : Collections.emptyList();
                p.setAchievements(list);

                p.setActiveChallenge((Integer) rs.getObject("active_challenge"));
                p.setChallengesCompleted(rs.getInt("challenges_completed"));
                p.setFollowersCount(rs.getInt("followers_count"));
                p.setFollowingCount(rs.getInt("following_count"));
                p.setVisibility(ProfileVisibility.fromString(rs.getString("visibility")));
                p.setCreatedAt(rs.getTimestamp("created_at").toInstant());
                p.setUpdatedAt(rs.getTimestamp("updated_at").toInstant());

                return p;
            }

        } catch (SQLException | JsonProcessingException e) {
            e.printStackTrace();
            return null;
        }
    }

    // Helpers

    private void bindProfile(PreparedStatement ps, ProfileInfo p) throws SQLException {
        ps.setLong(1, p.getUserId());
        ps.setString(2, p.getPhoneNumber());
        ps.setString(3, p.getFirstName());
        ps.setString(4, p.getLastName());
        ps.setString(5, p.getBio());
        ps.setString(6, p.getResume());
        ps.setInt(7, p.getGrowthScore());
        ps.setInt(8, p.getXpPoints());
        ps.setString(9, toJson(p.getAchievements()));
        ps.setObject(10, p.getActiveChallenge(), Types.INTEGER);
        ps.setInt(11, p.getChallengesCompleted());
        ps.setString(12, p.getVisibility().name());
        Instant now = Instant.now();
        ps.setTimestamp(13, Timestamp.from(now));
        ps.setTimestamp(14, Timestamp.from(now));
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            // fallback to empty array
            return "[]";
        }
    }

    private void append(StringBuilder sb, boolean first, String clause) {
        if (!first) sb.append(", ");
        sb.append(clause);
    }

    private void rollbackQuietly() {
        try (Connection conn = DatabaseConnection.getConnection()) {
            conn.rollback();
        } catch (SQLException ignored) { }
    }
}
