/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.configs;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;
/**
 *
 * @author acer
 */
@Configuration
@EnableWebSecurity
@EnableTransactionManagement
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity(prePostEnabled = true)
@PropertySource("classpath:configs.properties")
@ComponentScan(
        basePackages = {
            "com.hvh.controllers",
            "com.hvh.repository",
            "com.hvh.service",
            "com.hvh.payment",
        }
)
public class SpringSecurityConfigs {
    @Value("${cloudinary.cloud_name}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api_key}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api_secret}")
    private String cloudinaryApiSecret;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public HandlerMappingIntrospector mvcHandlerMappingIntrospector() {
        return new HandlerMappingIntrospector();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/admin/**", "/", "/login").csrf(c -> c.disable()).authorizeHttpRequests((requests) -> requests
                .requestMatchers("/", "/admin").hasRole("ADMIN")
                .anyRequest().permitAll()
        ).formLogin(form -> form.loginPage("/admin/login")
                .loginProcessingUrl("/login")
                .defaultSuccessUrl("/", true)
                .failureUrl("/admin/login?error=true")
                .permitAll()
        ).logout((logout) -> logout.logoutSuccessUrl("/admin/login").permitAll());
        return http.build();
    }

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudinaryCloudName,
                "api_key", cloudinaryApiKey,
                "api_secret", cloudinaryApiSecret,
                "secure", true));
    }
}
