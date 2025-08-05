package com.example.elitescorebackend.handlers;

import com.example.elitescorebackend.models.VerificationCode;
import com.example.elitescorebackend.util.DatabaseConnection;

import java.security.SecureRandom;
import java.sql.*;
import java.time.Duration;
import java.time.Instant;

public class VerificationCodeHandler {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int CODE_LENGTH = 6;             // six digits
    private static final int EXPIRATION_MINUTES = 15;

    private static VerificationCodeHandler instance;

    public static VerificationCodeHandler getInstance() {
        if (instance == null) {
            instance = new VerificationCodeHandler();
        }
        return instance;
    }

    public void generateVerificationCode(int userId, String requestIp) {
        // 1) build a zero-padded 6-digit numeric code
        int max = (int) Math.pow(10, CODE_LENGTH);
        int raw = RANDOM.nextInt(max);
        String code = String.format("%0" + CODE_LENGTH + "d", raw);

        // 2) timestamp now, set expiration 15 minutes ahead
        Instant now     = Instant.now();
        Instant expires = now.plus(Duration.ofMinutes(EXPIRATION_MINUTES));

        // 3) assemble the model
        VerificationCode vc = new VerificationCode();
        vc.setCode(Integer.parseInt(code));
        System.out.println(code);
        vc.setUser_id(userId);
        vc.setRequest_ip(requestIp);
        vc.setCreated_at(now);
        vc.setExpiration_date(expires);
        vc.setUsed(false);

        this.addVerificationCode(vc);
    }

    private void addVerificationCode(VerificationCode vc) {
        Connection connection = null;
        PreparedStatement stmt = null;
        try {
            connection = DatabaseConnection.getConnection();
            String sql = "INSERT INTO auth_code_table " +
                         "(code, user_id, created_at, expiration_date, used, request_ip) " +
                         "VALUES (?, ?, ?, ?, ?, ?)";
            stmt = connection.prepareStatement(sql);
            // assuming your code is numeric in the DB; parse as needed
            stmt.setInt(1, vc.getCode());
            stmt.setInt   (2, vc.getUser_id());
            stmt.setTimestamp  (3, Timestamp.from(vc.getCreated_at()));
            stmt.setTimestamp  (4, Timestamp.from(vc.getExpiration_date()));
            stmt.setBoolean(5, vc.isUsed());
            stmt.setString(6, vc.getRequest_ip());
            stmt.executeUpdate();
            connection.commit();
        } catch (SQLException e) {
            if (connection != null) try { connection.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            e.printStackTrace();
        } finally {
            if (stmt != null) try { stmt.close(); } catch (SQLException ignore) {}
            if (connection != null) try { connection.close(); } catch (SQLException ignore) {}
        }
    }

    public void purgeExpiredAndUsed() {
        String sql =
                "DELETE FROM auth_code_table WHERE used = TRUE " +
                        "OR created_at < (NOW() - INTERVAL '15 minutes')";
        try ( Connection c = DatabaseConnection.getConnection();
              PreparedStatement ps = c.prepareStatement(sql) )
        {
            int deleted = ps.executeUpdate();
            c.commit();
            System.out.println("Purged " + deleted + " stale verification codes");
        } catch(SQLException e) {
            System.err.println("Error purging verification codes"+ e.getMessage());
        }
    }


    public boolean verifyAndMarkUsed(int code, int userId, String requestIp) {
        Connection connection = null;
        PreparedStatement selectStmt = null;
        PreparedStatement updateStmt = null;
        ResultSet rs = null;

        try {
            connection = DatabaseConnection.getConnection();
//            System.out.println("[DEBUG] Starting verifyAndMarkUsed for code=" + code
//                    + ", userId=" + userId + ", requestIp=" + requestIp);

            String selectSql =
                    "SELECT user_id, created_at, used, request_ip " +
                            "FROM auth_code_table " +
                            "WHERE code = ? " +
                            "FOR UPDATE";
            selectStmt = connection.prepareStatement(selectSql);
            selectStmt.setInt(1, code);
            rs = selectStmt.executeQuery();

            if (!rs.next()) {
//                System.out.println("[DEBUG] No matching code found.");
                connection.rollback();
                return false;
            }

            int dbUserId        = rs.getInt("user_id");
            Instant createdAt = rs.getTimestamp("created_at").toInstant();
            boolean used        = rs.getBoolean("used");
            String dbIp         = rs.getString("request_ip");
            Instant now       = Instant.now();

//            System.out.println("[DEBUG] DB values → userId=" + dbUserId
//                    + ", createdAt=" + createdAt
//                    + ", used=" + used
//                    + ", requestIp=" + dbIp
//                    + ", now=" + now);

            boolean userMatches = (dbUserId == userId);
            boolean ipMatches   = dbIp.equals(requestIp);
            boolean notExpired = now.isBefore(createdAt.plus(Duration.ofMinutes(EXPIRATION_MINUTES)));

//            if (used) {
//                System.out.println("[DEBUG] Code already used.");
//            }
//            if (!userMatches) {
//                System.out.println("[DEBUG] userId mismatch: expected=" + dbUserId + ", got=" + userId);
//            }
//            if (!ipMatches) {
//                System.out.println("[DEBUG] IP mismatch: expected=" + dbIp + ", got=" + requestIp);
//            }
//            if (!notExpired) {
//                System.out.println("[DEBUG] Code expired. createdAt +15min = "
//                        + createdAt.plus(Duration.ofMinutes(EXPIRATION_MINUTES)));
//            }

            if (!used && userMatches && ipMatches && notExpired) {
//                System.out.println("[DEBUG] All checks passed. Marking code as used.");
                String updateSql = "UPDATE auth_code_table SET used = TRUE WHERE code = ?";
                updateStmt = connection.prepareStatement(updateSql);
                updateStmt.setInt(1, code);
                updateStmt.executeUpdate();
                connection.commit();
//                System.out.println("[DEBUG] Commit successful.");
                return true;
            } else {
//                System.out.println("[DEBUG] Verification failed. Rolling back.");
                connection.rollback();
                return false;
            }

        } catch (SQLException e) {
//            System.out.println("[ERROR] SQLException during verifyAndMarkUsed: " + e.getMessage());
            try { if (connection != null) connection.rollback(); } catch (SQLException ignore) {}
            return false;
        } finally {
            try { if (rs != null)        rs.close(); } catch (SQLException ignore) {}
            try { if (selectStmt != null) selectStmt.close(); } catch (SQLException ignore) {}
            try { if (updateStmt != null) updateStmt.close(); } catch (SQLException ignore) {}
            try { if (connection != null) connection.close(); } catch (SQLException ignore) {}
        }
    }

    public VerificationCode getLatestCodeForUser(int userId) {
        String sql = "SELECT * FROM auth_code_table "
                + "WHERE user_id = ? "
                + "ORDER BY created_at DESC "
                + "LIMIT 1";
        try (Connection c = DatabaseConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    VerificationCode vc = new VerificationCode();
                    vc.setCode(rs.getInt("code"));
                    vc.setUser_id(rs.getInt("user_id"));
                    Timestamp createdTs    = rs.getTimestamp("created_at");
                        vc.setCreated_at   (createdTs   != null ? createdTs.toInstant()   : null);
                    Timestamp expirationTs = rs.getTimestamp("expiration_date");
                        vc.setExpiration_date(expirationTs!= null ? expirationTs.toInstant(): null);
                    vc.setUsed(rs.getBoolean("used"));
                    vc.setRequest_ip(rs.getString("request_ip"));
                    return vc;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Returns how many verification codes the given user has generated
     * in the past hour.
     */
    public int countCodesLastHour(int userId) {
        String sql = ""
                + "SELECT COUNT(*) "
                + "  FROM auth_code_table "
                + " WHERE user_id = ? "
                + "   AND created_at >= (NOW() - INTERVAL '1 hour')";
        int count = 0;

        try ( Connection      conn = DatabaseConnection.getConnection();
              PreparedStatement ps  = conn.prepareStatement(sql) )
        {
            ps.setInt(1, userId);
            try ( ResultSet rs = ps.executeQuery() ) {
                if (rs.next()) {
                    count = rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return count;
    }



}
