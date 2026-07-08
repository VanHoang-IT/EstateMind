/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Property;
import com.hvh.repository.PropertyRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@PropertySource("classpath:configs.properties")
@Transactional
public class PropertyRepositoryImpl implements PropertyRepository {

    @Autowired
    private Environment env;

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public List<Property> getProperties(Map<String, String> params) {

        Session session = this.factory.getObject().getCurrentSession();

        CriteriaBuilder b = session.getCriteriaBuilder();
        CriteriaQuery<Property> q = b.createQuery(Property.class);
        Root<Property> root = q.from(Property.class);

        q.select(root);

        if (params != null) {

            List<Predicate> predicates = new ArrayList<>();

            String kw = params.get("kw");
            if (kw != null && !kw.isEmpty()) {
                predicates.add(
                        b.like(root.get("title"),
                                String.format("%%%s%%", kw))
                );
            }

            String fromPrice = params.get("fromPrice");
            if (fromPrice != null && !fromPrice.isEmpty()) {
                predicates.add(
                        b.greaterThanOrEqualTo(
                                root.get("price"),
                                new BigDecimal(fromPrice))
                );
            }

            String toPrice = params.get("toPrice");
            if (toPrice != null && !toPrice.isEmpty()) {
                predicates.add(
                        b.lessThanOrEqualTo(
                                root.get("price"),
                                new BigDecimal(toPrice))
                );
            }

            String cateId = params.get("cateId");
            if (cateId != null && !cateId.isEmpty()) {
                predicates.add(
                        b.equal(root.get("categoryId").get("id"),
                                Integer.parseInt(cateId))
                );
            }

            q.where(predicates.toArray(new Predicate[0]));
        }

        q.orderBy(b.desc(root.get("id")));

        Query<Property> query = session.createQuery(q);

        if (params != null) {

            int pageSize = env.getProperty(
                    "properties.page_size",
                    Integer.class,
                    10);

            int page = Integer.parseInt(
                    params.getOrDefault("page", "1"));

            query.setFirstResult((page - 1) * pageSize);
            query.setMaxResults(pageSize);
        }

        return query.getResultList();
    }

    @Override
    public Property getPropertyById(int id) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.get(Property.class, id);
    }

    @Override
    public void addOrUpdateProperty(Property property) {

        Session session = this.factory.getObject().getCurrentSession();

        if (property.getId() != null)
            session.merge(property);
        else
            session.persist(property);
    }

    @Override
    public void deleteProperty(int id) {

        Session session = this.factory.getObject().getCurrentSession();

        Property property = this.getPropertyById(id);

        if (property != null)
            session.remove(property);
    }
}
