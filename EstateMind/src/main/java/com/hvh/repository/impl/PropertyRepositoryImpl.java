/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Property;
import com.hvh.pojo.PropertyImages;
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

    private List<Predicate> buildPredicates(CriteriaBuilder b, Root<Property> root, Map<String, String> params) {
        List<Predicate> predicates = new ArrayList<>();
        if (params == null) {
            return predicates;
        }

        String search = params.get("search");
        if (search != null && !search.isBlank()) {
            predicates.add(b.like(b.lower(root.get("title")), String.format("%%%s%%", search.toLowerCase())));
        }

        String district = params.get("district");
        if (district != null && !district.isBlank()) {
            predicates.add(b.equal(root.get("district"), district));
        }

        String minPrice = params.get("minPrice");
        if (minPrice != null && !minPrice.isBlank()) {
            predicates.add(b.greaterThanOrEqualTo(root.get("price"), new BigDecimal(minPrice)));
        }

        String maxPrice = params.get("maxPrice");
        if (maxPrice != null && !maxPrice.isBlank()) {
            predicates.add(b.lessThanOrEqualTo(root.get("price"), new BigDecimal(maxPrice)));
        }

        String categoryId = params.get("categoryId");
        if (categoryId != null && !categoryId.isBlank()) {
            predicates.add(b.equal(root.get("categoryId").get("id"), Integer.parseInt(categoryId)));
        }

        String bedrooms = params.get("bedrooms");
        if (bedrooms != null && !bedrooms.isBlank()) {
            predicates.add(b.equal(root.get("bedrooms"), Integer.parseInt(bedrooms)));
        }

        return predicates;
    }

    private int resolvePageSize(Map<String, String> params) {
        int defaultSize = env.getProperty("properties.page_size", Integer.class, 10);
        if (params == null) {
            return defaultSize;
        }
        String size = params.get("size");
        if (size == null || size.isBlank()) {
            return defaultSize;
        }
        return Math.min(Integer.parseInt(size), 50); // hard cap so nobody asks for size=100000
    }

    private int resolvePage(Map<String, String> params) {
        if (params == null) {
            return 1;
        }
        int page = Integer.parseInt(params.getOrDefault("page", "1"));
        return Math.max(page, 1);
    }

    @Override
    public List<Property> getProperties(Map<String, String> params) {
        Session session = this.factory.getObject().getCurrentSession();

        CriteriaBuilder b = session.getCriteriaBuilder();
        CriteriaQuery<Property> q = b.createQuery(Property.class);
        Root<Property> root = q.from(Property.class);

        q.select(root).where(buildPredicates(b, root, params).toArray(new Predicate[0]));
        q.orderBy(b.desc(root.get("id")));

        Query<Property> query = session.createQuery(q);

        int pageSize = resolvePageSize(params);
        int page = resolvePage(params);
        query.setFirstResult((page - 1) * pageSize);
        query.setMaxResults(pageSize);

        return query.getResultList();
    }

    @Override
    public long countProperties(Map<String, String> params) {
        Session session = this.factory.getObject().getCurrentSession();

        CriteriaBuilder b = session.getCriteriaBuilder();
        CriteriaQuery<Long> q = b.createQuery(Long.class);
        Root<Property> root = q.from(Property.class);

        q.select(b.count(root)).where(buildPredicates(b, root, params).toArray(new Predicate[0]));

        return session.createQuery(q).getSingleResult();
    }

    @Override
    public Property getPropertyById(int id) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.get(Property.class, id);
    }

    @Override
    public void addOrUpdateProperty(Property property) {
        Session session = this.factory.getObject().getCurrentSession();

        if (property.getId() != null) {
            session.merge(property);
        } else {
            session.persist(property);
        }
    }

    @Override
    public void deleteProperty(int id) {
        Session session = this.factory.getObject().getCurrentSession();

        Property property = this.getPropertyById(id);

        if (property != null) {
            session.remove(property);
        }
    }

    @Override
    public void addPropertyImage(PropertyImages image) {
        Session session = this.factory.getObject().getCurrentSession();
        session.persist(image);
    }
}
