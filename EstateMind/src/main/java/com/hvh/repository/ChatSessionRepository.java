/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

import com.hvh.pojo.ChatSession;

/**
 * @author acer
 */
public interface ChatSessionRepository {

    ChatSession getSessionById(Integer id);

    ChatSession saveSession(ChatSession session);
}
