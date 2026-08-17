/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.hvh.dto.LoginRequestDTO;
import com.hvh.dto.LoginResponseDTO;
import com.hvh.dto.RegisterRequestDTO;
import com.hvh.dto.UpdateProfileDTO;
import com.hvh.dto.UpdateVerificationProfileDTO;
import com.hvh.dto.UserProfileResponseDTO;
import com.hvh.dto.VerificationProfileResponseDTO;
import com.hvh.service.UserService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author acer
 */
@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiUserController {

    @Autowired
    private UserService userService;

    @PostMapping(
            value = "/users",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserProfileResponseDTO> register(
            @Valid @ModelAttribute RegisterRequestDTO request,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.userService.register(request, avatar));
    }

    @PostMapping(
            value = "/login",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {

        return ResponseEntity.ok(this.userService.login(request));
    }

    @GetMapping(value = "/secure/profile", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponseDTO> getProfile(Principal principal) {

        return ResponseEntity.ok(this.userService.getUserProfile(principal.getName()));
    }

    @PutMapping(
            value = "/secure/profile",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponseDTO> updateProfile(
            @Valid @ModelAttribute UpdateProfileDTO request,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            Principal principal) {

        return ResponseEntity.ok(
                this.userService.updateProfile(principal.getName(), request, avatar));
    }

    @GetMapping(value = "/secure/verification-profile", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VerificationProfileResponseDTO<?>> getVerificationProfile(
            Principal principal) {

        return ResponseEntity.ok(this.userService.getVerificationProfile(principal.getName()));
    }

    @PutMapping(
            value = "/secure/verification-profile",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateVerificationProfile(
            @RequestBody UpdateVerificationProfileDTO request, Principal principal) {
        try {
            return ResponseEntity.ok(
                    this.userService.updateVerificationProfile(principal.getName(), request));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
