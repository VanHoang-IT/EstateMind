/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.hvh.dto.ReviewRequestDTO;
import com.hvh.dto.ReviewResponseDTO;
import com.hvh.pojo.User;
import com.hvh.service.ReviewService;
import com.hvh.service.UserService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @GetMapping("/rooms/{id}/reviews")
    public ResponseEntity<List<ReviewResponseDTO>> getReviewsByRoom(@PathVariable("id") Long roomId) {
        List<ReviewResponseDTO> reviews = this.reviewService.getReviewsByRoomId(roomId);
        
        return new ResponseEntity<>(reviews, HttpStatus.OK);
    }
}
