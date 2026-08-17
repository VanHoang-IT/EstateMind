/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.dto;

import com.hvh.pojo.Article;
import java.util.Date;
/**
 *
 * @author acer
 */
public class ArticleResponseDTO {

    private Long id;
    private String title;
    private String summary;
    private String category;
    private String imageUrl;
    private String sourceName;
    private String sourceUrl;
    private Date publishedAt;
    private String articleType;

    public ArticleResponseDTO() {
    }

    public ArticleResponseDTO(
            Long id,
            String title,
            String summary,
            String category,
            String imageUrl,
            String sourceName,
            String sourceUrl,
            Date publishedAt,
            String articleType
    ) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.imageUrl = imageUrl;
        this.sourceName = sourceName;
        this.sourceUrl = sourceUrl;
        this.publishedAt = publishedAt;
        this.articleType = articleType;
    }

    public static ArticleResponseDTO fromEntity(Article article) {
        return new ArticleResponseDTO(
                article.getId(),
                article.getTitle(),
                article.getSummary(),
                article.getCategory(),
                article.getImageUrl(),
                article.getSourceName(),
                article.getSourceUrl(),
                article.getPublishedAt(),
                article.getArticleType()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public Date getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Date publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getArticleType() {
        return articleType;
    }

    public void setArticleType(String articleType) {
        this.articleType = articleType;
    }
}
