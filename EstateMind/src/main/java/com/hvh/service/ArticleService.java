/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.dto.ArticleResponseDTO;
import java.util.List;

/**
 *
 * @author acer
 */
public interface ArticleService {
    List<ArticleResponseDTO> getLatestArticles(Integer limit);
    
    ArticleResponseDTO getArticleById(long id);
}
