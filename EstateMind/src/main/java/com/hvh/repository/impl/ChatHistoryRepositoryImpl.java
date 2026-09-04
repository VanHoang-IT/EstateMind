/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.ChatHistory;
import com.hvh.repository.ChatHistoryRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.List;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author acer
 */
/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

@Repository
@Transactional
public class ChatHistoryRepositoryImpl implements ChatHistoryRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public void saveHistory(ChatHistory history) {
        Session session = this.factory.getObject().getCurrentSession();
        session.persist(history);
    }

    @Override
    public List<ChatHistory> getHistoryBySessionId(int sessionId) {
        Session session = this.factory.getObject().getCurrentSession();

        CriteriaBuilder b = session.getCriteriaBuilder();
        CriteriaQuery<ChatHistory> q = b.createQuery(ChatHistory.class);
        Root<ChatHistory> root = q.from(ChatHistory.class);

        q.select(root).where(b.equal(root.get("sessionId").get("id"), sessionId));
        q.orderBy(b.asc(root.get("createdDate")));

        Query<ChatHistory> query = session.createQuery(q);
        return query.getResultList();
    }
}
