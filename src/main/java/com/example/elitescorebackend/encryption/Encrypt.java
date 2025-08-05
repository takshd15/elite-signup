package com.example.elitescorebackend.encryption;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

public class Encrypt {

    private static final int ITERATIONS = 4;
    private static final int MEMORY = 262144; // 256 MB
    private static final int PARALLELISM = 4;

//    private static final String pepper = System.getenv("PEPPER_KEY");//for now 1234


    // Hash the password (during registration)
    public static String hashPassword(String password) {
        Argon2 argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2d);

        try {
            return argon2.hash(ITERATIONS, MEMORY, PARALLELISM, (password).toCharArray());
        } finally {
            argon2.wipeArray(password.toCharArray());
        }
    }

    // Verify the password (during login)
    public static boolean verifyPassword(String storedHash, String inputPassword) {
        Argon2 argon2 = Argon2Factory.create((Argon2Factory.Argon2Types.ARGON2d));
        return argon2.verify(storedHash, (inputPassword).toCharArray());
    }

    public static void main(String[] args) {
        String username = hashPassword("1234");
        System.out.println(username);
    }

}
