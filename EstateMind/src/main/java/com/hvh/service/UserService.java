package com.hvh.service;

import com.hvh.dto.LoginRequestDTO;
import com.hvh.dto.LoginResponseDTO;
import com.hvh.dto.RegisterRequestDTO;
import com.hvh.dto.UpdateProfileDTO;
import com.hvh.dto.UpdateVerificationProfileDTO;
import com.hvh.dto.UserProfileResponseDTO;
import com.hvh.dto.VerificationProfileResponseDTO;
import com.hvh.pojo.Users;
import java.util.List;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.multipart.MultipartFile;
/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author acer
 */
public interface UserService extends UserDetailsService {
    Users getUserByUsername(String username);
    Users getUserById(int id);
    UserProfileResponseDTO register(
            RegisterRequestDTO request,
            MultipartFile avatar
    );
    LoginResponseDTO login(LoginRequestDTO request);
    UserProfileResponseDTO getUserProfile(String username);
    VerificationProfileResponseDTO<?> getVerificationProfile(
            String username
    );
    VerificationProfileResponseDTO<?> updateVerificationProfile(
            String username,
            UpdateVerificationProfileDTO request
    );
    void approveVerification(int userId);
    boolean authenticate(String username, String password);
    List<Users> getUsers(Integer page);
    Users updateRole(int id, String role);
    UserProfileResponseDTO updateProfile(
            String username,
            UpdateProfileDTO request,
            MultipartFile avatar
    );
}
