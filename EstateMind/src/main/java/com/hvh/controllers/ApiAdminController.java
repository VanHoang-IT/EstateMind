/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Category;
import com.hvh.pojo.Property;
import com.hvh.pojo.Review;
import com.hvh.pojo.Users;
import com.hvh.service.CategoryService;
import com.hvh.service.PropertyService;
import com.hvh.service.ReviewService;
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
import org.springframework.web.multipart.MultipartFile;
/**
 *
 * @author acer
 */
@RestController
@RequestMapping("/api/secure/admin")
@CrossOrigin
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class ApiAdminController {

    @Autowired
    private UserService userService;
    @Autowired
    private PropertyService propertyService;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private ReviewService reviewService;
    @Autowired
    private Cloudinary cloudinary;

    // ---- UPLOAD ẢNH (dùng chung cho property/category nếu cần ảnh rời) ----
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            Map result = this.cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("resource_type", "auto")
            );
            return new ResponseEntity<>(
                    Collections.singletonMap("url", result.get("secure_url")),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ---- QUẢN LÝ USER ----
    @GetMapping("/users")
    public ResponseEntity<List<Users>> getUsers(@RequestParam(name = "page", required = false) Integer page) {
        return new ResponseEntity<>(this.userService.getUsers(page), HttpStatus.OK);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable("id") int id) {
        try {
            return new ResponseEntity<>(this.userService.getUserById(id), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable("id") int id, @RequestBody Map<String, String> body) {
        try {
            Users updated = this.userService.updateRole(id, body.get("role"));
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    // ---- QUẢN LÝ BẤT ĐỘNG SẢN (bỏ qua ràng buộc "chỉ chủ tin mới sửa được") ----
    @GetMapping("/properties")
    public ResponseEntity<PageResponseDTO<Property>> getProperties(@RequestParam Map<String, String> params) {
        return new ResponseEntity<>(this.propertyService.getProperties(params), HttpStatus.OK);
    }

    @PostMapping("/properties")
    public ResponseEntity<?> createProperty(@RequestBody PropertyRequestDTO dto, Authentication auth) {
        try {
            Users admin = this.userService.getUserByUsername(auth.getName());
            Property created = this.propertyService.createProperty(dto, admin);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/properties/{id}")
    public ResponseEntity<?> updateProperty(@PathVariable("id") int id,
                                             @RequestBody PropertyRequestDTO dto,
                                             Authentication auth) {
        try {
            Users admin = this.userService.getUserByUsername(auth.getName());
            // admin luôn pass được assertOwnerOrAdmin() dù không phải sellerId gốc
            Property updated = this.propertyService.updateProperty(id, dto, admin);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/properties/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProperty(@PathVariable("id") int id, Authentication auth) {
        Users admin = this.userService.getUserByUsername(auth.getName());
        this.propertyService.deleteProperty(id, admin);
    }

    @PostMapping("/properties/{id}/image")
    public ResponseEntity<?> addPropertyImage(@PathVariable("id") int id,
                                               @RequestParam("file") MultipartFile file) {
        this.propertyService.addPropertyImage(id, file);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    // ---- QUẢN LÝ DANH MỤC (tương đương RoomType) ----
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return new ResponseEntity<>(this.categoryService.getCates(), HttpStatus.OK);
    }

    @PostMapping("/categories")
    public ResponseEntity<?> addCategory(@RequestBody Category category) {
        try {
            return new ResponseEntity<>(this.categoryService.addOrUpdateCategory(category), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable("id") int id, @RequestBody Category category) {
        try {
            category.setId(id);
            return new ResponseEntity<>(this.categoryService.addOrUpdateCategory(category), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable("id") int id) {
        this.categoryService.deleteCategory(id);
    }

    // ---- KIỂM DUYỆT ĐÁNH GIÁ ----
    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getReviews(@RequestParam Map<String, String> params) {
        return new ResponseEntity<>(this.reviewService.getReviews(params), HttpStatus.OK);
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable("id") int id, Authentication auth) {
        try {
            Users admin = this.userService.getUserByUsername(auth.getName());
            this.reviewService.deleteReview(id, admin);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }
}
