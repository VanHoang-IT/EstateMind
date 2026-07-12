/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.pojo.Review;
import com.hvh.repository.ReviewRepository;
import com.hvh.service.ReviewService;
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

    @Override
    public List<Review> getReviews(Map<String, String> params) {
        return reviewRepository.getReviews(params);
    }

    @Override
    public void addReviewOrUpdate(Review review) {
        reviewRepository.addReviewOrUpdate(review);
    }

    @Override
    public Review getReviewById(Long id) {
        return reviewRepository.getReviewById(id);
    }

    @Override
    public void deleteReview(Long id) {
        reviewRepository.deleteReview(id);
    }

    @Override
    public List<Review> getReviewsByPropertyId(Long propertyId) {
        return reviewRepository.getReviewsByPropertyId(propertyId);
    }

}
