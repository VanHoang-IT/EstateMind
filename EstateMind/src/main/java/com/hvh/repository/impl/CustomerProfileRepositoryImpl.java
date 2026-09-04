/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.CustomerProfile;
import com.hvh.repository.CustomerProfileRepository;
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
public class CustomerProfileRepositoryImpl implements CustomerProfileRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public CustomerProfile createProfile(CustomerProfile profile) {
        Session session = this.factory.getObject().getCurrentSession();
        session.persist(profile);
        return profile;
    }

    @Override
    public CustomerProfile getByUserId(int userId) {
        Session session = this.factory.getObject().getCurrentSession();

        Query<CustomerProfile> query =
                session.createQuery(
                        "FROM CustomerProfile c WHERE c.users.id = :userId", CustomerProfile.class);
        query.setParameter("userId", userId);

        return query.getResultStream().findFirst().orElse(null);
    }

    @Override
    public CustomerProfile updateProfile(CustomerProfile profile) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.merge(profile);
    }
    
    @Override
    public List<CustomerProfile> getPendingVerification() {
        Session session = this.factory.getObject().getCurrentSession();
 
        Query<CustomerProfile> query =
                session.createQuery(
                        "FROM CustomerProfile c WHERE c.identityVerified IS NULL OR"
                                + " c.identityVerified = false ORDER BY c.updatedAt DESC",
                        CustomerProfile.class);
 
        return query.getResultList();
    }
}
