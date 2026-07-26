/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.SellerProfile;
import com.hvh.repository.SellerProfileRepository;
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
public class SellerProfileRepositoryImpl implements SellerProfileRepository {

    @Autowired
    private LocalSessionFactoryBean factory;

    @Override
    public SellerProfile createProfile(SellerProfile profile) {
        Session session = this.factory.getObject().getCurrentSession();
        session.persist(profile);
        return profile;
    }

    @Override
    public SellerProfile getByUserId(int userId) {
        Session session = this.factory.getObject().getCurrentSession();

        Query<SellerProfile> query = session.createQuery(
                "FROM SellerProfile s WHERE s.users.id = :userId",
                SellerProfile.class);
        query.setParameter("userId", userId);

        return query.getResultStream().findFirst().orElse(null);
    }
}
