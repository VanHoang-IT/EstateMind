/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import com.hvh.service.FavoriteService;
import com.hvh.service.UserService;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
/**
 *
 * @author acer
 */
@RestController
@RequestMapping("/api/secure/favorites")
@CrossOrigin
@PreAuthorize("isAuthenticated()")
public class ApiFavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<Property>> list(Authentication auth) {
        Users user = this.userService.getUserByUsername(auth.getName());
        return new ResponseEntity<>(this.favoriteService.getFavoriteProperties(user), HttpStatus.OK);
    }

    @GetMapping("/{propertyId}/check")
    public ResponseEntity<Map<String, Boolean>> check(@PathVariable("propertyId") int propertyId, Authentication auth) {
        Users user = this.userService.getUserByUsername(auth.getName());
        boolean favorited = this.favoriteService.isFavorited(user, propertyId);
        return new ResponseEntity<>(Collections.singletonMap("favorited", favorited), HttpStatus.OK);
    }

    @PostMapping("/{propertyId}")
    public ResponseEntity<?> add(@PathVariable("propertyId") int propertyId, Authentication auth) {
        try {
            Users user = this.userService.getUserByUsername(auth.getName());
            this.favoriteService.addFavorite(user, propertyId);
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{propertyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable("propertyId") int propertyId, Authentication auth) {
        Users user = this.userService.getUserByUsername(auth.getName());
        this.favoriteService.removeFavorite(user, propertyId);
    }
}

