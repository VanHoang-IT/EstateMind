/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

import com.hvh.pojo.PropertyType;
import java.util.List;
/**
 *
 * @author acer
 */

public interface PropertyTypeRepository {
    List<PropertyType> getPropertyTypes();

    PropertyType getPropertyTypeById(int id);
}

