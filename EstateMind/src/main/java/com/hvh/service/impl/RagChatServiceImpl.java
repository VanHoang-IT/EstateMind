///*
// * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
// * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
// */
//package com.hvh.service.impl;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.hvh.dto.ChatResponseDTO;
//import com.hvh.pojo.ChatHistory;
//import com.hvh.pojo.ChatSession;
//import com.hvh.pojo.Users;
//import com.hvh.repository.ChatHistoryRepository;
//import com.hvh.repository.ChatSessionRepository;
//import com.hvh.service.RagChatService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpEntity;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
///**
// *
// * @author acer
// */
//@Service
//public class RagChatServiceImpl implements RagChatService {
//
//    @Autowired
//    private ChatSessionRepository chatSessionRepository;
//
//    @Autowired
//    private ChatHistoryRepository chatHistoryRepository;
//
//    private final ObjectMapper objectMapper = new ObjectMapper();
//    private static final String PYTHON_AI_URL = "http://localhost:8000/api/chat";
//    private final RestTemplate restTemplate = new RestTemplate();
//
//    @Override
//    public ChatResponseDTO generateFullAnswer(String userQuestion, Integer sessionId, Users currentUser) {
//        
//        ChatSession chatSession = null;
//        if (sessionId != null) {
//            chatSession = chatSessionRepository.getSessionById(sessionId);
//        }
//        
//        if (chatSession == null) {
//            chatSession = new ChatSession();
//            chatSession.setUserId(currentUser);
//            chatSession.setTitle(userQuestion.length() > 50 ? userQuestion.substring(0, 50) + "..." : userQuestion);
//            chatSession = chatSessionRepository.saveSession(chatSession);
//        }
//
//        String aiAnswer = "Xin lỗi, hệ thống AI đang bận.";
//        String sourceRefsJson = "[]";
//
//        try {
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//
//            Map<String, Object> requestBody = new HashMap<>();
//            requestBody.put("question", userQuestion);
//            requestBody.put("sessionId", chatSession.getId());
//
//            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
//
//            ResponseEntity<Map> response = restTemplate.postForEntity(PYTHON_AI_URL, request, Map.class);
//            
//            if (response.getBody() != null && "success".equals(response.getBody().get("status"))) {
//                aiAnswer = (String) response.getBody().get("answer");
//
//                List<String> sources = (List<String>) response.getBody().get("sources");
//                if (sources != null) {
//                    sourceRefsJson = objectMapper.writeValueAsString(sources);
//                }
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//
//        ChatHistory history = new ChatHistory();
//        history.setUserId(currentUser);
//        history.setQuestion(userQuestion);
//        history.setAnswer(aiAnswer);
//        history.setSessionId(chatSession);
//        history.setSourceRefs(sourceRefsJson);
//        
//        chatHistoryRepository.saveHistory(history);
//
//        return new ChatResponseDTO(aiAnswer, chatSession.getId());
//    }
//}

package com.hvh.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hvh.dto.ChatResponseDTO;
import com.hvh.pojo.ChatHistory;
import com.hvh.pojo.ChatSession;
import com.hvh.pojo.Users;
import com.hvh.repository.ChatHistoryRepository;
import com.hvh.repository.ChatSessionRepository;
import com.hvh.service.RagChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RagChatServiceImpl implements RagChatService {

    private static final Logger logger = LoggerFactory.getLogger(RagChatServiceImpl.class);
    private static final String PYTHON_AI_URL = "http://localhost:8000/api/chat";

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    // Cấu hình RestTemplate có Timeout để tránh treo luồng Java khi Python chậm
    public RagChatServiceImpl() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5)); // Timeout kết nối
        factory.setReadTimeout(Duration.ofSeconds(30));    // Timeout chờ AI xử lý RAG
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public ChatResponseDTO generateFullAnswer(String userQuestion, Integer sessionId, Users currentUser) {
        
        ChatSession chatSession = null;
        if (sessionId != null) {
            chatSession = chatSessionRepository.getSessionById(sessionId);
        }
        
        if (chatSession == null) {
            chatSession = new ChatSession();
            chatSession.setUserId(currentUser);
            chatSession.setTitle(userQuestion.length() > 50 ? userQuestion.substring(0, 50) + "..." : userQuestion);
            // Đảm bảo entity đã có logic @PrePersist hoặc gán thời gian tạo nếu DB yêu cầu NOT NULL
            chatSession = chatSessionRepository.saveSession(chatSession);
        }

        String aiAnswer = "Xin lỗi, hệ thống AI hiện đang bận hoặc không phản hồi. Vui lòng thử lại sau.";
        String sourceRefsJson = "[]";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("question", userQuestion);
            requestBody.put("sessionId", chatSession.getId());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Bắn request sang Python AI Engine
            ResponseEntity<Map> response = restTemplate.postForEntity(PYTHON_AI_URL, request, Map.class);
            
            if (response.getBody() != null && "success".equals(response.getBody().get("status"))) {
                aiAnswer = (String) response.getBody().get("answer");

                List<String> sources = (List<String>) response.getBody().get("sources");
                if (sources != null && !sources.isEmpty()) {
                    sourceRefsJson = objectMapper.writeValueAsString(sources);
                }
            }
        } catch (Exception e) {
            logger.error("Lỗi khi giao tiếp với Python AI Service tại {}: {}", PYTHON_AI_URL, e.getMessage(), e);
        }

        // Lưu vết lịch sử chat và nguồn tham chiếu (Minh bạch pháp lý)
        ChatHistory history = new ChatHistory();
        history.setUserId(currentUser);
        history.setQuestion(userQuestion);
        history.setAnswer(aiAnswer);
        history.setSessionId(chatSession);
        history.setSourceRefs(sourceRefsJson);
        
        chatHistoryRepository.saveHistory(history);

        return new ChatResponseDTO(aiAnswer, chatSession.getId());
    }
}