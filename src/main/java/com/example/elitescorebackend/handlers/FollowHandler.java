package com.example.elitescorebackend.handlers;

import com.example.elitescorebackend.models.User;
import com.example.elitescorebackend.util.DatabaseConnection;
import com.example.elitescorebackend.models.enums.UserRole;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FollowHandler {

    private static FollowHandler instance;

    private FollowHandler() { }

    public static FollowHandler getInstance() {
        if (instance == null) {
            instance = new FollowHandler();
        }
        return instance;
    }

    /**
     * Follow a user. Returns true if the follow was created, false if it already existed.
     */
    public boolean follow(int meId, int themId) {
        String sql = """
            INSERT INTO user_follows(follower_id, followee_id)
            VALUES (?, ?)
            ON CONFLICT DO NOTHING
            """;
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, meId);
            ps.setInt(2, themId);
            int affected = ps.executeUpdate();
            conn.commit();
            return affected > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            // rollback on error
            try (Connection conn = DatabaseConnection.getConnection()) {
                conn.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            return false;
        }
    }

    /**
     * Unfollow a user. Returns true if an existing follow was removed.
     */
    public boolean unfollow(int meId, int themId) {
        String sql = """
            DELETE FROM user_follows
            WHERE follower_id = ? AND followee_id = ?
            """;
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, meId);
            ps.setInt(2, themId);
            int affected = ps.executeUpdate();
            conn.commit();
            return affected > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            try (Connection conn = DatabaseConnection.getConnection()) {
                conn.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            return false;
        }
    }

    /**
     * Check if user "meId" is following "themId".
     */
    public boolean isFollowing(int meId, int themId) {
        String sql = """
            SELECT 1 FROM user_follows
            WHERE follower_id = ? AND followee_id = ?
            LIMIT 1
            """;
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, meId);
            ps.setInt(2, themId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * List all users who follow the given user.
     */
    public List<User> getFollowers(int userId) {
        String sql = """
            SELECT u.user_id, u.username, u.password_hash, u.role, u.email
            FROM user_follows f
            JOIN users_auth u ON u.user_id = f.follower_id
            WHERE f.followee_id = ?
            """;
        List<User> followers = new ArrayList<>();

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    followers.add(new User(
                        rs.getInt("user_id"),
                        rs.getString("username"),
                        rs.getString("password_hash"),
                        // assuming you have a fromLabel or similar constructor
                        UserRole.fromLabel(rs.getString("role")),
                        rs.getString("email")
                    ));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return followers;
    }

    /**
     * List all users whom the given user is following.
     */
    public List<User> getFollowing(int userId) {
        String sql = """
            SELECT u.user_id, u.username, u.password_hash, u.role, u.email
            FROM user_follows f
            JOIN users_auth u ON u.user_id = f.followee_id
            WHERE f.follower_id = ?
            """;
        List<User> following = new ArrayList<>();

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    following.add(new User(
                        rs.getInt("user_id"),
                        rs.getString("username"),
                        rs.getString("password_hash"),
                        UserRole.fromLabel(rs.getString("role")),
                        rs.getString("email")
                    ));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return following;
    }
}
