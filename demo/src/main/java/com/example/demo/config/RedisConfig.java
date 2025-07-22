package com.example.demo.config;

import java.time.Duration;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis configuration for caching
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * Configure Redis cache manager
     * 
     * @param connectionFactory Redis connection factory
     * @return Redis cache manager
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Default cache configuration
        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30)) // Cache entries expire after 30 minutes
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // Configure specific cache TTLs
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfig)
                .withCacheConfiguration("employees", 
                        cacheConfig.entryTtl(Duration.ofHours(1))) // Employee cache expires after 1 hour
                .withCacheConfiguration("employeeSearchResults", 
                        cacheConfig.entryTtl(Duration.ofMinutes(15))) // Search results expire after 15 minutes
                .withCacheConfiguration("employeeNameSearch", 
                        cacheConfig.entryTtl(Duration.ofMinutes(15))) // Name search results expire after 15 minutes
                .withCacheConfiguration("employeeEmailSearch", 
                        cacheConfig.entryTtl(Duration.ofMinutes(15))) // Email search results expire after 15 minutes
                .withCacheConfiguration("employeeDepartmentSearch", 
                        cacheConfig.entryTtl(Duration.ofMinutes(15))) // Department search results expire after 15 minutes
                .withCacheConfiguration("employeeJobTitleSearch", 
                        cacheConfig.entryTtl(Duration.ofMinutes(15))) // Job title search results expire after 15 minutes
                .build();
    }

    /**
     * Configure Redis template
     * 
     * @param connectionFactory Redis connection factory
     * @return Redis template
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}