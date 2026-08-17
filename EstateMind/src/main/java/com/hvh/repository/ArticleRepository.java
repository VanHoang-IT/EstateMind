/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

import com.hvh.pojo.Article;
import java.util.List;

/**
 *
 * @author acer
 */
public interface ArticleRepository {
    List<Article> getLatestArticles(int limit);
    Article getArticleById(long id);
}
