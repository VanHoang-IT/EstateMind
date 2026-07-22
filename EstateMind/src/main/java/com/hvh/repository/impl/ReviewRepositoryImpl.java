/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Review;
import com.hvh.repository.ReviewRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author acer
 */

@Repository
@Transactional
public class ReviewRepositoryImpl implements ReviewRepository {

    @Autowired
    private SessionFactory sessionFactory;

    @Override
    public List<Review> getReviews(Map<String, String> params) {

        Session session = sessionFactory.getCurrentSession();

        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Review> cq = cb.createQuery(Review.class);
        Root<Review> root = cq.from(Review.class);

        cq.select(root);

        List<Predicate> predicates = new ArrayList<>();

        if (params != null) {

            String propertyId = params.get("propertyId");

            if (propertyId != null && !propertyId.isEmpty()) {
                predicates.add(
                        cb.equal(root.get("propertyId").get("id"),
                                Integer.parseInt(propertyId))
                );
            }

            String visible = params.get("visible");

            if (visible != null) {
                predicates.add(
                        cb.equal(root.get("visible"),
                                Boolean.parseBoolean(visible))
                );
            }
        }

        cq.where(predicates.toArray(Predicate[]::new));
        cq.orderBy(cb.desc(root.get("createdAt")));

        return session.createQuery(cq).getResultList();
    }

    @Override
    public void addReviewOrUpdate(Review review) {
        Session session = sessionFactory.getCurrentSession();

        if (review.getId() == null)
            session.persist(review);
        else
            session.merge(review);
    }

    @Override
    public Review getReviewById(Integer id) {
        Session session = sessionFactory.getCurrentSession();
        return session.get(Review.class, id);
    }

    @Override
    public void deleteReview(Integer id) {
        Session session = sessionFactory.getCurrentSession();

        Review review = session.get(Review.class, id);

        if (review != null)
            session.remove(review);
    }

    @Override
    public List<Review> getReviewsByPropertyId(Integer propertyId) {

        Session session = sessionFactory.getCurrentSession();

        return session.createQuery(
                "FROM Review r WHERE r.propertyId.id = :id ORDER BY r.createdAt DESC",
                Review.class)
                .setParameter("id", propertyId)
                .getResultList();
    }
}
