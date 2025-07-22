package com.example.demo.security;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Tests for password encoding functionality
 */
class PasswordEncodingTest {

    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        // Using the same configuration as in SecurityConfig
        passwordEncoder = new BCryptPasswordEncoder(12);
    }

    @Test
    @DisplayName("Should encode password successfully")
    void testPasswordEncoding_ShouldEncodePassword() {
        // Given
        String rawPassword = "testPassword123";

        // When
        String encodedPassword = passwordEncoder.encode(rawPassword);

        // Then
        assertNotNull(encodedPassword);
        assertNotEquals(rawPassword, encodedPassword);
        assertTrue(encodedPassword.startsWith("$2a$12$")); // BCrypt with strength 12
    }

    @Test
    @DisplayName("Should validate correct password")
    void testPasswordValidation_CorrectPassword_ShouldReturnTrue() {
        // Given
        String rawPassword = "testPassword123";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        // When
        boolean matches = passwordEncoder.matches(rawPassword, encodedPassword);

        // Then
        assertTrue(matches);
    }

    @Test
    @DisplayName("Should reject incorrect password")
    void testPasswordValidation_IncorrectPassword_ShouldReturnFalse() {
        // Given
        String rawPassword = "testPassword123";
        String wrongPassword = "wrongPassword456";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        // When
        boolean matches = passwordEncoder.matches(wrongPassword, encodedPassword);

        // Then
        assertFalse(matches);
    }

    @Test
    @DisplayName("Should handle empty password")
    void testPasswordEncoding_EmptyPassword_ShouldEncodeSuccessfully() {
        // Given
        String emptyPassword = "";

        // When
        String encodedPassword = passwordEncoder.encode(emptyPassword);

        // Then
        assertNotNull(encodedPassword);
        assertTrue(passwordEncoder.matches(emptyPassword, encodedPassword));
    }

    @Test
    @DisplayName("Should handle null password gracefully")
    void testPasswordEncoding_NullPassword_ShouldThrowException() {
        // Given
        String nullPassword = null;

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            passwordEncoder.encode(nullPassword);
        });
    }

    @Test
    @DisplayName("Should generate different hashes for same password")
    void testPasswordEncoding_SamePassword_ShouldGenerateDifferentHashes() {
        // Given
        String password = "testPassword123";

        // When
        String hash1 = passwordEncoder.encode(password);
        String hash2 = passwordEncoder.encode(password);

        // Then
        assertNotEquals(hash1, hash2); // BCrypt uses salt, so hashes should be different
        assertTrue(passwordEncoder.matches(password, hash1));
        assertTrue(passwordEncoder.matches(password, hash2));
    }

    @Test
    @DisplayName("Should handle special characters in password")
    void testPasswordEncoding_SpecialCharacters_ShouldEncodeSuccessfully() {
        // Given
        String passwordWithSpecialChars = "P@ssw0rd!#$%^&*()";

        // When
        String encodedPassword = passwordEncoder.encode(passwordWithSpecialChars);

        // Then
        assertNotNull(encodedPassword);
        assertTrue(passwordEncoder.matches(passwordWithSpecialChars, encodedPassword));
    }

    @Test
    @DisplayName("Should handle long password")
    void testPasswordEncoding_LongPassword_ShouldEncodeSuccessfully() {
        // Given
        String longPassword = "a".repeat(70); // 70 character password (within BCrypt's 72-byte limit)

        // When
        String encodedPassword = passwordEncoder.encode(longPassword);

        // Then
        assertNotNull(encodedPassword);
        assertTrue(passwordEncoder.matches(longPassword, encodedPassword));
    }

    @Test
    @DisplayName("Should handle unicode characters in password")
    void testPasswordEncoding_UnicodeCharacters_ShouldEncodeSuccessfully() {
        // Given
        String unicodePassword = "пароль123密码";

        // When
        String encodedPassword = passwordEncoder.encode(unicodePassword);

        // Then
        assertNotNull(encodedPassword);
        assertTrue(passwordEncoder.matches(unicodePassword, encodedPassword));
    }

    @Test
    @DisplayName("Should be case sensitive")
    void testPasswordValidation_CaseSensitive_ShouldReturnFalse() {
        // Given
        String password = "TestPassword123";
        String encodedPassword = passwordEncoder.encode(password);
        String differentCasePassword = "testpassword123";

        // When
        boolean matches = passwordEncoder.matches(differentCasePassword, encodedPassword);

        // Then
        assertFalse(matches);
    }
}