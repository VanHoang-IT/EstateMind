/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.pojo.SellerProfile;
import com.hvh.pojo.Users;

/**
 * @author acer
 */
public interface SellerProfileService {
    SellerProfile createProfileForUser(Users user);

    SellerProfile getByUserId(int userId);

    SellerProfile updateProfile(SellerProfile profile);
}
