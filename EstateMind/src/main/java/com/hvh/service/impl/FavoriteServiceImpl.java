/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.pojo.Favorites;
import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import com.hvh.repository.FavoriteRepository;
import com.hvh.service.FavoriteService;
import com.hvh.service.PropertyService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author acer
 */
@Service
public class FavoriteServiceImpl implements FavoriteService {

    @Autowired
    private FavoriteRepository favoriteRepo;

    @Autowired
    private PropertyService propertyService;

    @Override
    public List<Property> getFavoriteProperties(Users user) {
        return this.favoriteRepo.getByUser(user.getId()).stream()
                .map(Favorites::getPropertyId)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isFavorited(Users user, int propertyId) {
        return this.favoriteRepo.find(user.getId(), propertyId) != null;
    }

    @Override
    public void addFavorite(Users user, int propertyId) {
        if (this.isFavorited(user, propertyId)) {
            return; // đã lưu rồi thì thôi, không lỗi
        }
        Property property =
                this.propertyService.getPropertyById(propertyId); // throws nếu không tồn tại

        Favorites f = new Favorites();
        f.setUserId(user);
        f.setPropertyId(property);
        this.favoriteRepo.add(f);
    }

    @Override
    public void removeFavorite(Users user, int propertyId) {
        this.favoriteRepo.remove(user.getId(), propertyId);
    }
}
