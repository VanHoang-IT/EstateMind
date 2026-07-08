/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.configs;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import com.hvh.filters.JwtFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

/**
 *
 * @author acer
 */
@Configuration
@EnableWebSecurity
@EnableTransactionManagement
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity(prePostEnabled = true)
@ComponentScan(
        basePackages = {
            "com.hvh.controllers",
            "com.hvh.repository",
            "com.hvh.service",
            "com.hvh.payment",
        }
)
public class SpringSecurityConfigs {

//    @Autowired
//    private UserDetailsService userDetailsService;

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
        Cloudinary cloudinary
                = new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", "dlwy7kulj",
                        "api_key", "154723282789693",
                        "api_secret", "znCTM7pZljeYLuNooE6u8Cy2Dms",
                        "secure", true));
        return cloudinary;
    }
}
