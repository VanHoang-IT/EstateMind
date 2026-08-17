/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.hvh.dto.ArticleResponseDTO;
import com.hvh.service.ArticleService;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

/**
 *
 * @author acer
 */
@RestController
@RequestMapping(
        value = "/api/articles",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@CrossOrigin
public class ApiArticleController {

    @Autowired
    private ArticleService articleService;


    @GetMapping
    public ResponseEntity<List<ArticleResponseDTO>> list(
            @RequestParam(
                    name = "limit",
                    required = false
            ) Integer limit
    ) {

        return ResponseEntity.ok(
                this.articleService
                        .getLatestArticles(
                                limit == null ? 20 : limit
                        )
        );
    }


    @GetMapping("/latest")
    public ResponseEntity<List<ArticleResponseDTO>> latest(
            @RequestParam(
                    name = "limit",
                    required = false
            ) Integer limit
    ) {

        return ResponseEntity.ok(
                this.articleService
                        .getLatestArticles(limit)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> details(
            @PathVariable("id") long id
    ) {

        try {

            return ResponseEntity.ok(
                    this.articleService
                            .getArticleById(id)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Không tìm thấy bài viết"
                                    )
                            )
                    );
        }
    }

    private String getMessage(
            Exception exception,
            String defaultMessage
    ) {

        String message
                = exception.getMessage();

        if (message == null
                || message.isBlank()) {

            return defaultMessage;
        }

        return message;
    }
}