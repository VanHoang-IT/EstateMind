/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.service.SemanticSearchService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
/**
 *
 * @author acer
 */
@Service
public class SemanticSearchServiceImpl implements SemanticSearchService {

    private static final Logger logger =
            LoggerFactory.getLogger(SemanticSearchServiceImpl.class);

    private static final String PYTHON_SEARCH_URL =
            (System.getenv("AI_SERVER_URL") != null
                            ? System.getenv("AI_SERVER_URL")
                            : "http://localhost:8000")
                    + "/api/search";

    private final RestTemplate restTemplate;

    public SemanticSearchServiceImpl() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(30_000);

        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public List<Integer> searchPropertyIds(String query, int limit) {

        List<Integer> propertyIds = new ArrayList<>();

        if (query == null || query.isBlank()) {
            return propertyIds;
        }

        int safeLimit = limit <= 0 ? 12 : Math.min(limit, 50);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, Object> requestBody = new HashMap<>();

            requestBody.put("query", query.trim());
            requestBody.put("limit", safeLimit);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response =
                    this.restTemplate.postForEntity(PYTHON_SEARCH_URL, request, Map.class);

            Map responseBody = response.getBody();

            if (responseBody == null
                    || !"success".equals(String.valueOf(responseBody.get("status")))) {

                logger.warn("Python AI tra response tim kiem khong hop le: {}", responseBody);

                return propertyIds;
            }

            Object rawIds = responseBody.get("propertyIds");

            if (!(rawIds instanceof List)) {
                return propertyIds;
            }

            Set<Integer> seen = new LinkedHashSet<>();

            for (Object rawId : (List<?>) rawIds) {

                if (rawId instanceof Number) {
                    seen.add(((Number) rawId).intValue());
                    continue;
                }

                try {
                    seen.add(Integer.valueOf(String.valueOf(rawId).trim()));
                } catch (NumberFormatException e) {
                    logger.warn("Bo qua propertyId khong hop le: {}", rawId);
                }
            }

            propertyIds.addAll(seen);

        } catch (Exception e) {
            logger.error(
                    "Loi khi goi Python Search Service tai {}: {}",
                    PYTHON_SEARCH_URL,
                    e.getMessage(),
                    e);
        }

        return propertyIds;
    }
}
