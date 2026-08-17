package com.hvh.service;

import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Property;
import com.hvh.pojo.Users;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface PropertyService {

    PageResponseDTO<Property> getProperties(
            Map<String, String> params
    );


    Property getPropertyById(int id);


    Property createProperty(
            PropertyRequestDTO dto,
            Users seller
    );


    Property createProperty(
            PropertyRequestDTO dto,
            Users seller,
            MultipartFile mainImage,
            List<MultipartFile> propertyImages
    );


    Property updateProperty(
            int id,
            PropertyRequestDTO dto,
            Users currentUser
    );


    Property updateProperty(
            int id,
            PropertyRequestDTO dto,
            Users currentUser,
            MultipartFile mainImage,
            List<MultipartFile> propertyImages
    );


    /*
     * ADMIN
     */
    Property approveProperty(
            int id,
            Users admin
    );


    Property rejectProperty(
            int id,
            Users admin,
            String reason
    );


    void deleteProperty(
            int id,
            Users currentUser
    );


    void addPropertyImage(
            int propertyId,
            MultipartFile file
    );


    void addPropertyImages(
            int propertyId,
            List<MultipartFile> files,
            Users currentUser
    );
}