/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.PropertyType;
import com.hvh.repository.PropertyTypeRepository;
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
@Repository
@Transactional
public class PropertyTypeRepositoryImpl implements PropertyTypeRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public List<PropertyType> getPropertyTypes() {
        Session session = this.factory.getObject().getCurrentSession();

        Query<PropertyType> query =
                session.createQuery("FROM PropertyType ORDER BY name", PropertyType.class);

        return query.getResultList();
    }

    @Override
    public PropertyType getPropertyTypeById(int id) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.get(PropertyType.class, id);
    }
}
