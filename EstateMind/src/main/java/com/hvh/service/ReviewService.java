/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.pojo.Review;
import java.util.List;
import java.util.Map;
/**
 *
 * @author acer
 */
public interface ReviewService {
    List<Review> getReviews(Map<String, String> params);
    void addReviewOrUpdate(Review review);
    Review getReviewById(Long id);
    void deleteReview(Long id);
    List<Review> getReviewsByPropertyId(Long propertyId);
}