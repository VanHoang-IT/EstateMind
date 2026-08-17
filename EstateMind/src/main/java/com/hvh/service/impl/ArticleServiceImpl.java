/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.dto.ArticleResponseDTO;
import com.hvh.pojo.Article;
import com.hvh.repository.ArticleRepository;
import com.hvh.service.ArticleService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
/**
 *
 * @author acer
 */
@Service
public class ArticleServiceImpl implements ArticleService {

    private static final int DEFAULT_LIMIT = 3;
    private static final int MAX_LIMIT = 20;

    @Autowired
    private ArticleRepository articleRepo;

    @Override
    @Transactional(readOnly = true)
    public List<ArticleResponseDTO> getLatestArticles(Integer limit) {
        int resolvedLimit = resolveLimit(limit);

        return this.articleRepo
                .getLatestArticles(resolvedLimit)
                .stream()
                .map(ArticleResponseDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ArticleResponseDTO getArticleById(long id) {
        if (id <= 0) {
            throw new IllegalArgumentException("Mã bài viết không hợp lệ");
        }

        Article article = this.articleRepo.getArticleById(id);

        if (article == null) {
            throw new IllegalArgumentException(
                    "Không tìm thấy bài viết với id " + id
            );
        }

        return ArticleResponseDTO.fromEntity(article);
    }

    private int resolveLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }

        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }

        return Math.min(limit, MAX_LIMIT);
    }
}
