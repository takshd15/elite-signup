package com.example.elitescorebackend.handlers;

import com.example.elitescorebackend.util.DatabaseConnection;

import java.sql.*;

public class TokenRevocationHandler {

    private static TokenRevocationHandler instance;

    public static TokenRevocationHandler getInstance() {
        if (instance == null) {
            instance = new TokenRevocationHandler();
        }
        return instance;
    }

    /**
     * Revokes the given JWT ID (jti) by calling the revoke_jwt_and_cleanup DB function.
     */
    public void revokeToken(String jti) {
        Connection connection = null;
        CallableStatement stmt = null;
        try {
            connection = DatabaseConnection.getConnection();
            String sql = "{ CALL revoke_jwt(?) }";
            stmt = connection.prepareCall(sql);
            stmt.setString(1, jti);
            stmt.execute();
            connection.commit();
        } catch (SQLException e) {
            try {
                if (connection != null) connection.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            e.printStackTrace();
        } finally {
            try {
                if (stmt != null) stmt.close();
                if (connection != null) connection.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    public void deleteOldTokens(){
        String sql = "DELETE FROM jwt_revocation WHERE revoked_at < now() - INTERVAL '24 hours'";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            int deleted = ps.executeUpdate();
            conn.commit();
            System.out.println("RevocationCleanupJob: deleted " + deleted + " old entries.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Returns true if the given JWT ID (jti) has been revoked.
     */
    public boolean isRevoked(String jti) {
        Connection connection = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        boolean revoked = false;
        try {
            connection = DatabaseConnection.getConnection();
            String sql = "SELECT 1 FROM jwt_revocation WHERE jti = ? LIMIT 1";
            stmt = connection.prepareStatement(sql);
            stmt.setString(1, jti);
            rs = stmt.executeQuery();
            revoked = rs.next();
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            try {
                if (rs != null) rs.close();
                if (stmt != null) stmt.close();
                if (connection != null) connection.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return revoked;
    }
}
