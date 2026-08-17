/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.dto.ReviewRequestDTO;
import com.hvh.pojo.Review;
import com.hvh.pojo.Users;
import java.util.List;
import java.util.Map;

/**
 * @author acer
 */
public interface ReviewService {
    List<Review> getReviews(Map<String, String> params);

    Review getReviewById(Integer id);

    Review createReview(ReviewRequestDTO dto, Users author);

    void deleteReview(Integer id, Users currentUser);

    List<Review> getReviewsByPropertyId(Integer propertyId);
}
