/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import java.util.List;
/**
 *
 * @author acer
 */
public interface FavoriteService {
    List<Property> getFavoriteProperties(Users user);
    boolean isFavorited(Users user, int propertyId);
    void addFavorite(Users user, int propertyId);
    void removeFavorite(Users user, int propertyId);
}
