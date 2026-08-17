/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.pojo.PropertyType;
import com.hvh.repository.PropertyTypeRepository;
import com.hvh.service.PropertyTypeService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author acer
 */
@Service
public class PropertyTypeServiceImpl implements PropertyTypeService {

    @Autowired
    private PropertyTypeRepository propertyTypeRepo;

    @Override
    public List<PropertyType> getPropertyTypes() {
        return this.propertyTypeRepo.getPropertyTypes();
    }

    @Override
    public PropertyType getPropertyTypeById(int id) {
        return this.propertyTypeRepo.getPropertyTypeById(id);
    }
}
