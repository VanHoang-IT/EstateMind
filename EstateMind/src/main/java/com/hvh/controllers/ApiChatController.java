package com.hvh.controllers;

import com.hvh.dto.ChatResponseDTO;
import com.hvh.pojo.Users;
import com.hvh.service.RagChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * @author acer
 */
@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiChatController {

    @Autowired
    private RagChatService ragChatService;

    public static class ChatRequestPayload {
        private String question;
        private Integer sessionId;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        
        public Integer getSessionId() { return sessionId; }
        public void setSessionId(Integer sessionId) { this.sessionId = sessionId; }
    }

    @PostMapping("/chat/ask")
    public ResponseEntity<ChatResponseDTO> askQuestion(@RequestBody ChatRequestPayload request, 
                                                       Principal principal) {
        Users currentUser = new Users();
        if (principal != null) {
        } else {
            currentUser.setId(1); 
        }

        ChatResponseDTO response = this.ragChatService.generateFullAnswer(
                request.getQuestion(),
                request.getSessionId(),
                currentUser
        );

        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}