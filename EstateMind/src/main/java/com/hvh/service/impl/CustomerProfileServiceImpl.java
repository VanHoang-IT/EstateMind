/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.pojo.CustomerProfile;
import com.hvh.pojo.Users;
import com.hvh.repository.CustomerProfileRepository;
import com.hvh.service.CustomerProfileService;
import java.util.Date;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author acer
 */
@Service
public class CustomerProfileServiceImpl implements CustomerProfileService {

    @Autowired
    private CustomerProfileRepository customerProfileRepo;

    @Override
    @Transactional
    public CustomerProfile createProfileForUser(Users user) {

        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Người dùng chưa được lưu");
        }

        CustomerProfile existing = this.customerProfileRepo.getByUserId(user.getId());

        if (existing != null) {
            return existing;
        }

        Date now = new Date();

        CustomerProfile profile = new CustomerProfile();

        profile.setId(user.getId());
        profile.setUsers(user);
        profile.setAddress(null);
        profile.setIdentityNumber(null);
        profile.setIdentityVerified(false);
        profile.setCreatedAt(now);
        profile.setUpdatedAt(now);

        return this.customerProfileRepo.createProfile(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerProfile getByUserId(int userId) {
        return this.customerProfileRepo.getByUserId(userId);
    }

    @Override
    @Transactional
    public CustomerProfile updateProfile(CustomerProfile profile) {
        return this.customerProfileRepo.updateProfile(profile);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CustomerProfile> getPendingVerification() {
        return this.customerProfileRepo.getPendingVerification();
    }
}
