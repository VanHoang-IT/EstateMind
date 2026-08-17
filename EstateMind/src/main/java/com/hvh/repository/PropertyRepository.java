/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

import com.hvh.pojo.Property;
import com.hvh.pojo.PropertyImages;
import java.util.List;
import java.util.Map;

/**
 * @author acer
 */
public interface PropertyRepository {
    List<Property> getProperties(Map<String, String> params);

    long countProperties(Map<String, String> params);

    void addOrUpdateProperty(Property property);

    Property getPropertyById(int id);

    void deleteProperty(int id);

    void addPropertyImage(PropertyImages image);
}
