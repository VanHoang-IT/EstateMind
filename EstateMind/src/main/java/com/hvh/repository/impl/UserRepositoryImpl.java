/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Users;
import com.hvh.repository.UserRepository;
import java.util.List;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author acer
 */
@Repository
@Transactional
@PropertySource("classpath:configs.properties")
public class UserRepositoryImpl implements UserRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private Environment env;

    @Override
    @Transactional(readOnly = true)
    public Users getUserByUsername(String username) {
        Session session = this.factory.getObject().getCurrentSession();

        Query<Users> query = session.createNamedQuery("Users.findByUsername", Users.class);

        query.setParameter("username", username);

        return query.getResultStream().findFirst().orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Users getUserById(int id) {
        Session session = this.factory.getObject().getCurrentSession();

        return session.get(Users.class, id);
    }

    @Override
    public Users addUser(Users user) {
        Session session = this.factory.getObject().getCurrentSession();

        session.persist(user);
        session.flush();

        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean authenticate(String username, String password) {

        Users user = this.getUserByUsername(username);

        return user != null
                && Boolean.TRUE.equals(user.getActive())
                && this.passwordEncoder.matches(password, user.getPassword());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Users> getUsers(Integer page) {
        Session session = this.factory.getObject().getCurrentSession();

        Query<Users> query = session.createQuery("FROM Users ORDER BY id DESC", Users.class);

        if (page != null) {
            int pageSize = env.getProperty("properties.page_size", Integer.class, 10);

            query.setFirstResult((Math.max(page, 1) - 1) * pageSize);

            query.setMaxResults(pageSize);
        }

        return query.getResultList();
    }

    @Override
    public Users updateRole(int id, String role) {
        Session session = this.factory.getObject().getCurrentSession();

        Users user = session.get(Users.class, id);

        if (user == null) {
            throw new IllegalArgumentException("Không tìm thấy người dùng với id " + id);
        }

        user.setUserRole(role);
        session.merge(user);

        return user;
    }

    @Override
    public Users updateUser(Users u) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.merge(u);
    }
}
