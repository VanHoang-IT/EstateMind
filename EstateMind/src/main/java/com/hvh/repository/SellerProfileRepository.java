/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

import com.hvh.pojo.SellerProfile;
/**
 *
 * @author acer
 */
public interface SellerProfileRepository {
    SellerProfile createProfile(SellerProfile profile);
    SellerProfile getByUserId(int userId);
}
