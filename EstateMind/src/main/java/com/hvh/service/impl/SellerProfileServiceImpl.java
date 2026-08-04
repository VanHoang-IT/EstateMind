/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.pojo.SellerProfile;
import com.hvh.pojo.Users;
import com.hvh.repository.SellerProfileRepository;
import com.hvh.service.SellerProfileService;
import java.math.BigDecimal;
import java.util.Date;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author acer
 */
@Service
public class SellerProfileServiceImpl
        implements SellerProfileService {

    @Autowired
    private SellerProfileRepository sellerProfileRepo;

    @Override
    @Transactional
    public SellerProfile createProfileForUser(Users user) {

        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException(
                    "Người dùng chưa được lưu"
            );
        }

        SellerProfile existing =
                this.sellerProfileRepo.getByUserId(
                        user.getId()
                );

        if (existing != null) {
            return existing;
        }

        Date now = new Date();

        SellerProfile profile =
                new SellerProfile();

        profile.setId(user.getId());
        profile.setUsers(user);
        profile.setBio(null);
        profile.setIsVerified(false);
        profile.setVerifiedAt(null);
        profile.setRatingAvg(BigDecimal.ZERO);
        profile.setTotalProperties(0);
        profile.setCompanyId(null);
        profile.setCreatedAt(now);
        profile.setUpdatedAt(now);

        return this.sellerProfileRepo.createProfile(
                profile
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SellerProfile getByUserId(int userId) {
        return this.sellerProfileRepo.getByUserId(
                userId
        );
    }
    
    @Override
    @Transactional
    public SellerProfile updateProfile(SellerProfile profile) {
        return this.sellerProfileRepo.updateProfile(profile);
    }
}
