package com.example.elitescorebackend.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * Manages a connection pool to the PostgreSQL database using HikariCP.
 * Provides a static method to obtain database connections.
 * <p>
 * Ensures that all connections are returned with autocommit disabled,
 * so transactions are handled explicitly throughout the application.
 */
public class DatabaseConnection {

    /**
     * Flag indicating whether the connection pool initialization logic has run.
     */
    public static boolean notloaded = false;

    private static final HikariDataSource dataSource;

    static {

        String username = System.getenv("DB_USER");
        String password = System.getenv("DB_PASS");
        String link = System.getenv("DATABASE_URL");

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        config.setJdbcUrl(link);//db
        config.setUsername(username);
        config.setPassword(password);

        // pool settings
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(2);
        config.setIdleTimeout(300_000);
        config.setConnectionTimeout(10_000);
        config.setPoolName("Pool");

        dataSource = new HikariDataSource(config);
    }

    /**
     * Returns a connection from the HikariCP connection pool.
     * The connection is returned with autocommit disabled,
     * so the caller must commit or rollback explicitly.
     *
     * @return a valid {@link Connection} with autocommit disabled.
     * @throws SQLException if a database access error occurs.
     */
    public static Connection getConnection() throws SQLException {
        try {
            if (!notloaded) {
                Class.forName("com.example.elitescorebackend.util.DatabaseConnection");
                Class.forName("org.postgresql.Driver");
                Class.forName("com.zaxxer.hikari.HikariDataSource");
                System.out.println("DatabaseConnection initialized successfully.");
                notloaded = true;
            }
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(
                    "Could not load DatabaseConnection class for pool init", e);
        }

        Connection connection = dataSource.getConnection();
        connection.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
        connection.setAutoCommit(false);

        return connection;
    }
}
