/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

import com.hvh.pojo.Favorites;
import java.util.List;

/**
 * @author acer
 */
public interface FavoriteRepository {
    List<Favorites> getByUser(int userId);

    Favorites find(int userId, int propertyId);

    void add(Favorites favorite);

    void remove(int userId, int propertyId);
}
