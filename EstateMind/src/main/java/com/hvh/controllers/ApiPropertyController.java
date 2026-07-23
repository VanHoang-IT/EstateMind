package com.hvh.controllers;

import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import com.hvh.service.PropertyService;
import com.hvh.service.UserService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author acer
 */
@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiPropertyController {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private UserService userService;

    @GetMapping("/properties")
    public ResponseEntity<PageResponseDTO<Property>> list(@RequestParam Map<String, String> params) {
        return new ResponseEntity<>(this.propertyService.getProperties(params), HttpStatus.OK);
    }

    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<?> details(@PathVariable(value = "propertyId") int id) {
        try {
            return new ResponseEntity<>(this.propertyService.getPropertyById(id), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Các endpoint ghi (create/update/delete) đặt dưới /secure/** để khớp với
    // ApiSecurityConfigs (chỉ /api/secure/** yêu cầu đăng nhập, phần còn lại permitAll).

    @PostMapping("/secure/properties")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> create(@RequestBody PropertyRequestDTO dto, Authentication auth) {
        try {
            Users seller = this.userService.getUserByUsername(auth.getName());
            Property created = this.propertyService.createProperty(dto, seller);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/secure/properties/{propertyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> update(@PathVariable(value = "propertyId") int id,
                                     @RequestBody PropertyRequestDTO dto,
                                     Authentication auth) {
        try {
            Users currentUser = this.userService.getUserByUsername(auth.getName());
            Property updated = this.propertyService.updateProperty(id, dto, currentUser);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            // covers "not found" and "not the owner" — same as SmartHotel's
            // ApiReservationController pattern (RuntimeException -> 404/403-ish)
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @DeleteMapping("/secure/properties/{propertyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@PathVariable(value = "propertyId") int id, Authentication auth) {
        try {
            Users currentUser = this.userService.getUserByUsername(auth.getName());
            this.propertyService.deleteProperty(id, currentUser);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}
