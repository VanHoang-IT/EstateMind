/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Category;
import com.hvh.repository.CategoryRepository;
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
public class CategoryRepositoryImpl implements CategoryRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public List<Category> getCates() {
        Session session = this.factory.getObject().getCurrentSession();

        Query<Category> query = session.createQuery(
                "FROM Category",
                Category.class);

        return query.getResultList();
    }
    
    @Override
    public Category getCategoryById(int id) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.get(Category.class, id);
    }
}
