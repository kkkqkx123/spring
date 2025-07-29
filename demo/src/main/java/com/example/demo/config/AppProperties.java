package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * Application-specific configuration properties
 */
@Data
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String name;
    private String version;
    private String description;

    private Jwt jwt = new Jwt();
    private Security security = new Security();
    private Websocket websocket = new Websocket();
    private Cors cors = new Cors();
    private Features features = new Features();
    private Business business = new Business();

    @Data
    public static class Jwt {
        private String secret;
        private long expirationMs;
        private long refreshExpirationMs;
    }

    @Data
    public static class Security {
        private String jwtHeader = "Authorization";
        private String jwtPrefix = "Bearer ";
        private int passwordStrength = 8;
    }

    @Data
    public static class Websocket {
        private String[] allowedOrigins;
        private String endpoint = "/ws";
    }

    @Data
    public static class Cors {
        private String[] allowedOrigins;
        private String[] allowedMethods;
        private String[] allowedHeaders;
        private boolean allowCredentials = true;
    }

    @Data
    public static class Features {
        private Chat chat = new Chat();
        private Email email = new Email();
        private Notifications notifications = new Notifications();
        private Payroll payroll = new Payroll();
        private ExcelImport excelImport = new ExcelImport();

        @Data
        public static class Chat {
            private boolean enabled = true;
        }

        @Data
        public static class Email {
            private boolean enabled = true;
        }

        @Data
        public static class Notifications {
            private boolean enabled = true;
        }

        @Data
        public static class Payroll {
            private boolean enabled = true;
        }

        @Data
        public static class ExcelImport {
            private boolean enabled = true;
        }
    }

    @Data
    public static class Business {
        private int maxEmployeesPerDepartment = 1000;
        private String maxFileUploadSize = "50MB";
        private String sessionTimeout = "30m";
        private int passwordExpiryDays = 90;
    }
}