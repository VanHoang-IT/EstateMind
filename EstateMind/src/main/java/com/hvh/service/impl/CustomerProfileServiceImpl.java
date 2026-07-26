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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 *
 * @author acer
 */
@Service
public class CustomerProfileServiceImpl implements CustomerProfileService {

    @Autowired
    private CustomerProfileRepository customerProfileRepo;

    @Override
    public CustomerProfile createProfileForUser(Users user) {
        CustomerProfile profile = new CustomerProfile();
        profile.setId(user.getId()); // khoá chính dùng chung với Users.id — bắt buộc set tay
        profile.setUsers(user);
        profile.setIdentityVerified(false);
        profile.setCreatedAt(new Date());
        profile.setUpdatedAt(new Date());

        return this.customerProfileRepo.createProfile(profile);
    }

    @Override
    public CustomerProfile getByUserId(int userId) {
        return this.customerProfileRepo.getByUserId(userId);
    }
}