/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.hvh.service;

import com.hvh.dto.ChatResponseDTO;
import com.hvh.pojo.Users;

/**
 * @author acer
 */
public interface RagChatService {

    ChatResponseDTO generateFullAnswer(String userQuestion, Integer sessionId, Users currentUser);
}
