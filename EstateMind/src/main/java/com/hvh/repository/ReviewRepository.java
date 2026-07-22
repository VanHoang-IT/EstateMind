/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

/**
 *
 * @author acer
 */
import com.hvh.pojo.Review;
import java.util.List;
import java.util.Map;

public interface ReviewRepository {
    List<Review> getReviews(Map<String, String> params);
    void addReviewOrUpdate(Review review);
    Review getReviewById(Integer id);
    void deleteReview(Integer id);
    List<Review> getReviewsByPropertyId(Integer propertyId);
}