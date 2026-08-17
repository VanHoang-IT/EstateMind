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
import java.util.Locale;
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

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;

    @Autowired
    private Environment env;

    @Autowired
    private LocalSessionFactoryBean factory;
    private List<Predicate> buildPredicates(
            CriteriaBuilder builder,
            Root<Property> root,
            Map<String, String> params
    ) {

        List<Predicate> predicates = new ArrayList<>();

        if (params == null || params.isEmpty()) {
            return predicates;
        }

        String search = trimToNull(params.get("search"));

        if (search != null) {
            String pattern
                    = "%"
                    + escapeLike(search)
                            .toLowerCase(Locale.ROOT)
                    + "%";

            predicates.add(
                    builder.like(
                            builder.lower(root.get("title")),
                            pattern,
                            '\\'
                    )
            );
        }

        String district = trimToNull(params.get("district"));

        if (district != null) {
            predicates.add(
                    builder.equal(
                            root.get("district"),
                            district
                    )
            );
        }

        BigDecimal minPrice
                = parseBigDecimal(params.get("minPrice"));

        if (minPrice != null) {
            predicates.add(
                    builder.greaterThanOrEqualTo(
                            root.get("price"),
                            minPrice
                    )
            );
        }

        BigDecimal maxPrice
                = parseBigDecimal(params.get("maxPrice"));

        if (maxPrice != null) {
            predicates.add(
                    builder.lessThanOrEqualTo(
                            root.get("price"),
                            maxPrice
                    )
            );
        }

        Integer categoryId
                = parsePositiveInteger(
                        params.get("categoryId")
                );

        if (categoryId != null) {
            predicates.add(
                    builder.equal(
                            root.get("categoryId").get("id"),
                            categoryId
                    )
            );
        }
        
        Integer propertyTypeId
                = parsePositiveInteger(
                        params.get("propertyTypeId")
                );

        if (propertyTypeId != null) {
            predicates.add(
                    builder.equal(
                            root.get("categoryId")
                                    .get("propertyTypeId")
                                    .get("id"),
                            propertyTypeId
                    )
            );
        }

        Integer bedrooms
                = parseNonNegativeInteger(
                        params.get("bedrooms")
                );

        if (bedrooms != null) {
            predicates.add(
                    builder.equal(
                            root.get("bedrooms"),
                            bedrooms
                    )
            );
        }

        String status
                = normalizeUppercase(
                        params.get("status")
                );

        if (status != null) {
            predicates.add(
                    builder.equal(
                            root.get("status"),
                            status
                    )
            );
        }

        String moderationStatus
                = normalizeUppercase(
                        params.get("moderationStatus")
                );

        if (moderationStatus != null) {
            predicates.add(
                    builder.equal(
                            root.get("moderationStatus"),
                            moderationStatus
                    )
            );
        }

        Integer sellerId
                = parsePositiveInteger(
                        params.get("sellerId")
                );

        if (sellerId != null) {
            predicates.add(
                    builder.equal(
                            root.get("sellerId").get("id"),
                            sellerId
                    )
            );
        }

        return predicates;
    }

    private int resolvePageSize(
            Map<String, String> params
    ) {

        int configuredDefault
                = readConfiguredPageSize();

        if (params == null) {
            return configuredDefault;
        }

        Integer requestedSize
                = parsePositiveInteger(
                        params.get("size")
                );

        if (requestedSize == null) {
            return configuredDefault;
        }

        return Math.min(
                requestedSize,
                MAX_PAGE_SIZE
        );
    }

    private int resolvePage(
            Map<String, String> params
    ) {

        if (params == null) {
            return 1;
        }

        Integer page
                = parsePositiveInteger(
                        params.get("page")
                );

        return page == null
                ? 1
                : page;
    }

    private int readConfiguredPageSize() {

        Integer configured
                = env.getProperty(
                        "properties.page_size",
                        Integer.class,
                        DEFAULT_PAGE_SIZE
                );

        if (configured == null
                || configured < 1) {

            return DEFAULT_PAGE_SIZE;
        }

        return Math.min(
                configured,
                MAX_PAGE_SIZE
        );
    }

    @Override
    public List<Property> getProperties(
            Map<String, String> params
    ) {

        Session session
                = this.factory
                        .getObject()
                        .getCurrentSession();

        CriteriaBuilder builder
                = session.getCriteriaBuilder();

        CriteriaQuery<Property> queryDefinition
                = builder.createQuery(
                        Property.class
                );

        Root<Property> root
                = queryDefinition.from(
                        Property.class
                );

        List<Predicate> predicates
                = buildPredicates(
                        builder,
                        root,
                        params
                );

        queryDefinition.select(root);

        if (!predicates.isEmpty()) {
            queryDefinition.where(
                    predicates.toArray(
                            new Predicate[0]
                    )
            );
        }

        queryDefinition.orderBy(
                builder.desc(
                        root.get("id")
                )
        );

        Query<Property> query
                = session.createQuery(
                        queryDefinition
                );

        int pageSize
                = resolvePageSize(
                        params
                );

        int page
                = resolvePage(
                        params
                );

        query.setFirstResult(
                (page - 1)
                * pageSize
        );

        query.setMaxResults(
                pageSize
        );

        return query.getResultList();
    }

    @Override
    public long countProperties(
            Map<String, String> params
    ) {

        Session session
                = this.factory
                        .getObject()
                        .getCurrentSession();

        CriteriaBuilder builder
                = session.getCriteriaBuilder();

        CriteriaQuery<Long> queryDefinition
                = builder.createQuery(
                        Long.class
                );

        Root<Property> root
                = queryDefinition.from(
                        Property.class
                );

        List<Predicate> predicates
                = buildPredicates(
                        builder,
                        root,
                        params
                );

        queryDefinition.select(
                builder.count(root)
        );

        if (!predicates.isEmpty()) {
            queryDefinition.where(
                    predicates.toArray(
                            new Predicate[0]
                    )
            );
        }

        return session
                .createQuery(
                        queryDefinition
                )
                .getSingleResult();
    }

    @Override
    public Property getPropertyById(
            int id
    ) {

        Session session
                = this.factory
                        .getObject()
                        .getCurrentSession();

        return session.get(
                Property.class,
                id
        );
    }

    @Override
    public void addOrUpdateProperty(
            Property property
    ) {

        Session session
                = this.factory
                        .getObject()
                        .getCurrentSession();

        if (property.getId() == null) {
            session.persist(
                    property
            );

            return;
        }

        session.merge(
                property
        );
    }

    @Override
    public void deleteProperty(
            int id
    ) {

        Session session
                = this.factory
                        .getObject()
                        .getCurrentSession();

        Property property
                = session.get(
                        Property.class,
                        id
                );

        if (property != null) {
            session.remove(
                    property
            );
        }
    }

    @Override
    public void addPropertyImage(
            PropertyImages image
    ) {

        Session session
                = this.factory
                        .getObject()
                        .getCurrentSession();

        session.persist(
                image
        );
    }

 
    private String trimToNull(
            String value
    ) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value.trim();
    }

    private String normalizeUppercase(
            String value
    ) {

        String normalized
                = trimToNull(
                        value
                );

        if (normalized == null) {
            return null;
        }

        return normalized
                .toUpperCase(
                        Locale.ROOT
                );
    }

    private BigDecimal parseBigDecimal(
            String value
    ) {

        String normalized
                = trimToNull(
                        value
                );

        if (normalized == null) {
            return null;
        }

        try {

            return new BigDecimal(
                    normalized
            );

        } catch (NumberFormatException e) {

            return null;
        }
    }

    private Integer parsePositiveInteger(
            String value
    ) {

        Integer parsed
                = parseInteger(
                        value
                );

        if (parsed == null
                || parsed < 1) {

            return null;
        }

        return parsed;
    }

    private Integer parseNonNegativeInteger(
            String value
    ) {

        Integer parsed
                = parseInteger(
                        value
                );

        if (parsed == null
                || parsed < 0) {

            return null;
        }

        return parsed;
    }

    private Integer parseInteger(
            String value
    ) {

        String normalized
                = trimToNull(
                        value
                );

        if (normalized == null) {
            return null;
        }

        try {

            return Integer.valueOf(
                    normalized
            );

        } catch (NumberFormatException e) {

            return null;
        }
    }

    private String escapeLike(
            String value
    ) {

        return value
                .replace(
                        "\\",
                        "\\\\"
                )
                .replace(
                        "%",
                        "\\%"
                )
                .replace(
                        "_",
                        "\\_"
                );
    }
}
