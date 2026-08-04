package com.hvh.controllers;

import com.hvh.dto.ChatResponseDTO;
import com.hvh.pojo.Users;
import com.hvh.service.RagChatService;
import com.hvh.service.UserService;
import java.security.Principal;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author acer
 */
@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiChatController {

    @Autowired
    private RagChatService ragChatService;

    @Autowired
    private UserService userService;

    public static class ChatRequestPayload {

        private String question;
        private Integer sessionId;

        public String getQuestion() {
            return question;
        }

        public void setQuestion(String question) {
            this.question = question;
        }

        public Integer getSessionId() {
            return sessionId;
        }

        public void setSessionId(Integer sessionId) {
            this.sessionId = sessionId;
        }
    }

    @PostMapping(
            value = "/chat/ask",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> askQuestion(
            @RequestBody ChatRequestPayload request, Principal principal) {

        try {
            if (request.getQuestion() == null || request.getQuestion().isBlank()) {
                return new ResponseEntity<>(
                        Map.of("message", "Câu hỏi không được để trống"), HttpStatus.BAD_REQUEST);
            }

            Users currentUser;

            if (principal != null) {
                currentUser = this.userService.getUserByUsername(principal.getName());
            } else {

                currentUser = this.userService.getUserById(1);
            }

            if (currentUser == null) {
                return new ResponseEntity<>(
                        Map.of("message", "Không xác định được người dùng"),
                        HttpStatus.INTERNAL_SERVER_ERROR);
            }

            ChatResponseDTO response =
                    this.ragChatService.generateFullAnswer(
                            request.getQuestion().trim(), request.getSessionId(), currentUser);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (RuntimeException e) {
            e.printStackTrace();

            return new ResponseEntity<>(
                    Map.of(
                            "message",
                            e.getMessage() != null ? e.getMessage() : "Không thể xử lý câu hỏi"),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
