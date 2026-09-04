/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Property;
import com.hvh.repository.StatisticRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.List;
import org.hibernate.Session;
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
public class StatisticRepositoryImpl implements StatisticRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public long countProperties() {
        Session session = this.factory.getObject().getCurrentSession();
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        cq.select(cb.count(cq.from(Property.class)));
        return session.createQuery(cq).getSingleResult();
    }

    @Override
    public List<Object[]> getPropertiesByModerationStatus() {
        Session session = this.factory.getObject().getCurrentSession();
        CriteriaBuilder cb = session.getCriteriaBuilder();
        CriteriaQuery<Object[]> cq = cb.createQuery(Object[].class);
        Root<Property> root = cq.from(Property.class);
        cq.multiselect(root.get("moderationStatus"), cb.count(root));
        cq.groupBy(root.get("moderationStatus"));
        cq.orderBy(cb.desc(cb.count(root)));
        return session.createQuery(cq).getResultList();
    }
}