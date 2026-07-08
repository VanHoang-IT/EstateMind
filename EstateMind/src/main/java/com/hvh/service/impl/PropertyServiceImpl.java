/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.pojo.Property;
import com.hvh.repository.PropertyRepository;
import com.hvh.service.PropertyService;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 *
 * @author acer
 */
@Service
public class PropertyServiceImpl implements PropertyService {

    @Autowired
    private PropertyRepository propertyRepo;

    @Override
    public List<Property> getProperties(Map<String, String> params) {
        return this.propertyRepo.getProperties(params);
    }

    @Override
    public void addOrUpdateProperty(Property property) {
        this.propertyRepo.addOrUpdateProperty(property);
    }

    @Override
    public Property getPropertyById(int id) {
        return this.propertyRepo.getPropertyById(id);
    }

    @Override
    public void deleteProperty(int id) {
        this.propertyRepo.deleteProperty(id);
    }
}
