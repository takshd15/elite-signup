package com.example.elitescorebackend.handlers;

import com.example.elitescorebackend.models.PreUser;
import com.example.elitescorebackend.models.User;
import com.example.elitescorebackend.models.enums.UserRole;
import com.example.elitescorebackend.util.DatabaseConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;


public class PreUserHandler {

    private static PreUserHandler instance;

    public static PreUserHandler getInstance() {
        if (instance == null) {
            instance = new PreUserHandler();
        }
        return instance;
    }

    public void addPreUser(PreUser user) {
        Connection connection = null;
        PreparedStatement stmt = null;
        try {
            connection = DatabaseConnection.getConnection();
            String query = "INSERT INTO pre_users_info (name,email) VALUES (?, ?)";
            stmt = connection.prepareStatement(query);
            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getEmail());
            stmt.executeUpdate();
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
}
