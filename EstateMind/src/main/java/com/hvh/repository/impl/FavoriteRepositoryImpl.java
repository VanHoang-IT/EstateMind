/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Favorites;
import com.hvh.repository.FavoriteRepository;
import java.util.Date;
import java.util.List;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author acer
 */
@Repository
@Transactional
public class FavoriteRepositoryImpl implements FavoriteRepository {

    @Autowired
    private SessionFactory sessionFactory;

    @Override
    public List<Favorites> getByUser(int userId) {
        Session session = sessionFactory.getCurrentSession();
        Query<Favorites> q =
                session.createQuery(
                        "FROM Favorites f WHERE f.userId.id = :userId ORDER BY f.createdDate DESC",
                        Favorites.class);
        q.setParameter("userId", userId);
        return q.getResultList();
    }

    @Override
    public Favorites find(int userId, int propertyId) {
        Session session = sessionFactory.getCurrentSession();
        Query<Favorites> q =
                session.createQuery(
                        "FROM Favorites f WHERE f.userId.id = :userId AND f.propertyId.id ="
                                + " :propertyId",
                        Favorites.class);
        q.setParameter("userId", userId);
        q.setParameter("propertyId", propertyId);
        return q.getResultStream().findFirst().orElse(null);
    }

    @Override
    public void add(Favorites favorite) {
        favorite.setCreatedDate(new Date());
        Session session = sessionFactory.getCurrentSession();
        session.persist(favorite);
    }

    @Override
    public void remove(int userId, int propertyId) {
        Favorites existing = this.find(userId, propertyId);
        if (existing != null) {
            Session session = sessionFactory.getCurrentSession();
            session.remove(existing);
        }
    }
}
