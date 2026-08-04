/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.pojo.CustomerProfile;
import com.hvh.pojo.Users;
/**
 *
 * @author acer
 */
public interface CustomerProfileService {
    CustomerProfile createProfileForUser(Users user);
    CustomerProfile getByUserId(int userId);
    CustomerProfile updateProfile(CustomerProfile profile);
}

