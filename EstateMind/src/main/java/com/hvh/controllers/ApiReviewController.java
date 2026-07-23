/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.hvh.dto.ReviewRequestDTO;
import com.hvh.pojo.Review;
import com.hvh.pojo.Users;
import com.hvh.service.ReviewService;
import com.hvh.service.UserService;
import java.util.List;
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
@RequestMapping("/api")
@CrossOrigin
public class ApiReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private UserService userService;

    @GetMapping("/properties/{propertyId}/reviews")
    public ResponseEntity<List<Review>> byProperty(@PathVariable("propertyId") Integer propertyId) {
        return new ResponseEntity<>(this.reviewService.getReviewsByPropertyId(propertyId), HttpStatus.OK);
    }

    @PostMapping("/secure/reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> create(@RequestBody ReviewRequestDTO dto, Authentication auth) {
        try {
            Users author = this.userService.getUserByUsername(auth.getName());
            Review created = this.reviewService.createReview(dto, author);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/secure/reviews/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@PathVariable("reviewId") Integer reviewId, Authentication auth) {
        try {
            Users currentUser = this.userService.getUserByUsername(auth.getName());
            this.reviewService.deleteReview(reviewId, currentUser);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}


