/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
/**
 *
 * @author acer
 */
public interface PropertyService {

    PageResponseDTO<Property> getProperties(Map<String, String> params);
    Property getPropertyById(int id);
    Property createProperty(PropertyRequestDTO dto, Users seller);
    Property updateProperty(int id, PropertyRequestDTO dto, Users currentUser);
    void deleteProperty(int id, Users currentUser);
    void addPropertyImage(int propertyId, MultipartFile file);
}