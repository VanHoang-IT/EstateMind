/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.ChatSession;
import com.hvh.repository.ChatSessionRepository;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public class ChatSessionRepositoryImpl implements ChatSessionRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public ChatSession getSessionById(Integer id) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.get(ChatSession.class, id);
    }

    @Override
    public ChatSession saveSession(ChatSession chatSession) {
        Session session = this.factory.getObject().getCurrentSession();

        if (chatSession.getId() != null)
            session.merge(chatSession);
        else
            session.persist(chatSession);

        return chatSession;
    }
}