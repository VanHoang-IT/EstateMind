/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.dto.ReviewRequestDTO;
import com.hvh.pojo.Property;
import com.hvh.pojo.Review;
import com.hvh.pojo.Users;
import com.hvh.repository.ReviewRepository;
import com.hvh.service.PropertyService;
import com.hvh.service.ReviewService;
import java.util.Date;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author acer
 */
@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private PropertyService propertyService;

    @Override
    public List<Review> getReviews(Map<String, String> params) {
        return reviewRepository.getReviews(params);
    }

    @Override
    public Review getReviewById(Integer id) {
        Review review = reviewRepository.getReviewById(id);
        if (review == null) {
            throw new RuntimeException("Không tìm thấy đánh giá với id " + id);
        }
        return review;
    }

    @Override
    public Review createReview(ReviewRequestDTO dto, Users author) {
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new IllegalArgumentException("Nội dung đánh giá không được để trống");
        }
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("Đánh giá phải từ 1 đến 5 sao");
        }

        Property property = this.propertyService.getPropertyById(dto.getPropertyId()); // throws nếu không tồn tại

        Review review = new Review();
        review.setContent(dto.getContent());
        review.setRating(dto.getRating());
        review.setPropertyId(property);
        review.setUserId(author);
        review.setVisible(true);
        review.setCreatedAt(new Date());

        this.reviewRepository.addReviewOrUpdate(review);
        return review;
    }

    @Override
    public void deleteReview(Integer id, Users currentUser) {
        Review review = this.getReviewById(id);

        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getUserRole());
        boolean isAuthor = review.getUserId() != null && review.getUserId().getId().equals(currentUser.getId());

        if (!isAdmin && !isAuthor) {
            throw new RuntimeException("Bạn không có quyền xoá đánh giá này");
        }

        this.reviewRepository.deleteReview(id);
    }

    @Override
    public List<Review> getReviewsByPropertyId(Integer propertyId) {
        return reviewRepository.getReviewsByPropertyId(propertyId);
    }

}
