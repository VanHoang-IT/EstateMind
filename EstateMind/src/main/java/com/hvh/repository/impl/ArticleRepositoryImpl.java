/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Article;
import com.hvh.repository.ArticleRepository;
import java.util.List;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author acer
 */
@Repository
@Transactional
public class ArticleRepositoryImpl implements ArticleRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    @Transactional(readOnly = true)
    public List<Article> getLatestArticles(int limit) {
        Session session = this.factory.getObject().getCurrentSession();

        Query<Article> query = session.createQuery(
                "FROM Article a ORDER BY a.publishedAt DESC, a.id DESC",
                Article.class
        );

        query.setMaxResults(limit);

        return query.getResultList();
    }

    @Override
    @Transactional(readOnly = true)
    public Article getArticleById(long id) {
        Session session = this.factory.getObject().getCurrentSession();

        return session.get(Article.class, id);
    }
}
