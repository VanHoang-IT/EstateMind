/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 *
 * @author acer
 */
public class ReviewRequestDTO {
    
    @Min(value = 1, message = "Rating thấp nhất là 1 sao")
    @Max(value = 5, message = "Rating cao nhất là 5 sao")
    private int rating;
    
    @Size(max = 255, message = "Bình luận không quá 255 ký tự")
    private String content;
    
    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
