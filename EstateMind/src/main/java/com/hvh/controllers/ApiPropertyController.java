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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @GetMapping(
            value = "/properties/{propertyId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> details(@PathVariable(value = "propertyId") int id) {
        try {
            return new ResponseEntity<>(
                    this.propertyService.getPropertyById(id),
                    HttpStatus.OK
            );
        } catch (RuntimeException e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                    e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

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
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @PostMapping(
            value = "/secure/properties/{propertyId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadImage(@PathVariable(value = "propertyId") int id,
            @RequestParam("file") MultipartFile file) {
        try {
            this.propertyService.addPropertyImage(id, file);
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
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
