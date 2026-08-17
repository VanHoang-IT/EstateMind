package com.hvh.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hvh.dto.ChatResponseDTO;
import com.hvh.pojo.ChatHistory;
import com.hvh.pojo.ChatSession;
import com.hvh.pojo.Users;
import com.hvh.repository.ChatHistoryRepository;
import com.hvh.repository.ChatSessionRepository;
import com.hvh.service.RagChatService;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
public class RagChatServiceImpl implements RagChatService {

    private static final Logger logger = LoggerFactory.getLogger(RagChatServiceImpl.class);

    private static final String PYTHON_AI_URL = "http://localhost:8000/api/chat";

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    private final ObjectMapper objectMapper;

    private final RestTemplate restTemplate;

    public RagChatServiceImpl() {
        this.objectMapper = new ObjectMapper();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // Dùng số mili giây để tương thích với nhiều phiên bản Spring.
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(30_000);

        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    @Transactional
    public ChatResponseDTO generateFullAnswer(
            String userQuestion, Integer sessionId, Users currentUser) {

        if (userQuestion == null || userQuestion.isBlank()) {
            throw new IllegalArgumentException("Câu hỏi không được để trống");
        }

        if (currentUser == null || currentUser.getId() == null) {
            throw new IllegalArgumentException("Người dùng không hợp lệ");
        }

        String normalizedQuestion = userQuestion.trim();

        ChatSession chatSession = null;

        if (sessionId != null) {
            chatSession = this.chatSessionRepository.getSessionById(sessionId);

            if (chatSession != null
                    && chatSession.getUserId() != null
                    && !currentUser.getId().equals(chatSession.getUserId().getId())) {
                throw new SecurityException("Bạn không có quyền sử dụng phiên chat này");
            }
        }

        if (chatSession == null) {
            chatSession = new ChatSession();
            chatSession.setUserId(currentUser);

            chatSession.setTitle(
                    normalizedQuestion.length() > 50
                            ? normalizedQuestion.substring(0, 50) + "..."
                            : normalizedQuestion);

            /*
             * Nếu ChatSession đã có @PrePersist thì hai field
             * thời gian sẽ được tự động gán.
             */
            chatSession = this.chatSessionRepository.saveSession(chatSession);
        } else {
            /*
             * Cập nhật thời gian hoạt động của phiên chat.
             * Nếu ChatSession có @PreUpdate thì Hibernate
             * cũng sẽ tự cập nhật updatedAt.
             */
            chatSession.setUpdatedAt(new Date());

            chatSession = this.chatSessionRepository.saveSession(chatSession);
        }

        String aiAnswer =
                "Xin lỗi, hệ thống AI hiện đang bận hoặc không phản hồi. "
                        + "Vui lòng thử lại sau.";

        String sourceRefsJson = "[]";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, Object> requestBody = new HashMap<>();

            requestBody.put("question", normalizedQuestion);

            requestBody.put("sessionId", chatSession.getId());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response =
                    this.restTemplate.postForEntity(PYTHON_AI_URL, request, Map.class);

            Map responseBody = response.getBody();

            if (responseBody != null
                    && "success".equals(String.valueOf(responseBody.get("status")))) {

                Object answerValue = responseBody.get("answer");

                if (answerValue instanceof String && !((String) answerValue).isBlank()) {
                    aiAnswer = ((String) answerValue).trim();
                }

                Object sourcesValue = responseBody.get("sources");

                if (sourcesValue instanceof List && !((List<?>) sourcesValue).isEmpty()) {
                    sourceRefsJson = this.objectMapper.writeValueAsString(sourcesValue);
                }
            } else {
                logger.warn("Python AI trả response không hợp lệ: {}", responseBody);
            }

        } catch (Exception e) {
            /*
             * Không ném lỗi ra ngoài.
             * Nếu Python AI chưa chạy, API Java vẫn trả câu fallback
             * và lưu lịch sử chat thay vì trả HTTP 500.
             */
            logger.error(
                    "Lỗi khi giao tiếp với Python AI Service tại {}: {}",
                    PYTHON_AI_URL,
                    e.getMessage(),
                    e);
        }

        ChatHistory history = new ChatHistory();

        history.setUserId(currentUser);
        history.setSessionId(chatSession);
        history.setQuestion(normalizedQuestion);
        history.setAnswer(aiAnswer);
        history.setSourceRefs(sourceRefsJson);

        // Dòng này rất quan trọng nếu created_date là NOT NULL.
        history.setCreatedDate(new Date());

        this.chatHistoryRepository.saveHistory(history);

        return new ChatResponseDTO(aiAnswer, chatSession.getId());
    }
}
