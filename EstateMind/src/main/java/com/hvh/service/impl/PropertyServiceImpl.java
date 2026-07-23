/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Category;
import com.hvh.pojo.Property;
import com.hvh.pojo.PropertyImages;
import com.hvh.pojo.Users;
import com.hvh.repository.CategoryRepository;
import com.hvh.repository.PropertyRepository;
import com.hvh.service.PropertyService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
/**
 *
 * @author acer
 */
@Service
public class PropertyServiceImpl implements PropertyService {

    @Autowired
    private PropertyRepository propertyRepo;

    @Autowired
    private CategoryRepository categoryRepo;

    @Autowired
    private Cloudinary cloudinary;

    @Override
    public PageResponseDTO<Property> getProperties(Map<String, String> params) {
        List<Property> items = this.propertyRepo.getProperties(params);
        long total = this.propertyRepo.countProperties(params);

        int page = params != null ? Integer.parseInt(params.getOrDefault("page", "1")) : 1;
        int size = 10;
        if (params != null && params.get("size") != null && !params.get("size").isBlank()) {
            size = Integer.parseInt(params.get("size"));
        }

        return new PageResponseDTO<>(items, page, size, total);
    }

    @Override
    public Property getPropertyById(int id) {
        Property property = this.propertyRepo.getPropertyById(id);
        if (property == null) {
            throw new RuntimeException("Không tìm thấy bất động sản với id " + id);
        }
        return property;
    }

    @Override
    public Property createProperty(PropertyRequestDTO dto, Users seller) {
        validate(dto);

        Property property = new Property();
        mapDtoToEntity(dto, property);
        property.setSellerId(seller);
        property.setStatus(dto.getStatus() != null ? dto.getStatus() : "PENDING");
        property.setCreatedAt(new Date());
        property.setUpdatedAt(new Date());

        this.propertyRepo.addOrUpdateProperty(property);
        return property;
    }

    @Override
    public Property updateProperty(int id, PropertyRequestDTO dto, Users currentUser) {
        validate(dto);

        Property property = this.getPropertyById(id);
        assertOwnerOrAdmin(property, currentUser);

        mapDtoToEntity(dto, property);
        property.setUpdatedAt(new Date());

        this.propertyRepo.addOrUpdateProperty(property);
        return property;
    }

    @Override
    public void deleteProperty(int id, Users currentUser) {
        Property property = this.getPropertyById(id);
        assertOwnerOrAdmin(property, currentUser);

        this.propertyRepo.deleteProperty(id);
    }

    @Override
    public void addPropertyImage(int propertyId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        Property property = this.getPropertyById(propertyId);

        try {
            Map res = this.cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("resource_type", "auto"));

            PropertyImages image = new PropertyImages();
            image.setPropertyId(property);
            image.setImageUrl(res.get("secure_url").toString());
            image.setIsPrimary(true);

            this.propertyRepo.addPropertyImage(image);
        } catch (IOException ex) {
            Logger.getLogger(PropertyServiceImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    private void validate(PropertyRequestDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("Tiêu đề không được để trống");
        }
        if (dto.getAddress() == null || dto.getAddress().isBlank()) {
            throw new IllegalArgumentException("Địa chỉ không được để trống");
        }
        if (dto.getPrice() == null || dto.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("Giá phải lớn hơn 0");
        }
        if (dto.getCategoryId() == null) {
            throw new IllegalArgumentException("Thiếu categoryId");
        }
    }

    private void mapDtoToEntity(PropertyRequestDTO dto, Property property) {
        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setAddress(dto.getAddress());
        property.setPrice(dto.getPrice());
        property.setArea(dto.getArea());
        if (dto.getStatus() != null) {
            property.setStatus(dto.getStatus());
        }
        property.setDistrict(dto.getDistrict());
        property.setBedrooms(dto.getBedrooms());
        property.setLatitude(dto.getLatitude());
        property.setLongitude(dto.getLongitude());

        Category category = this.categoryRepo.getCategoryById(dto.getCategoryId());
        if (category == null) {
            throw new IllegalArgumentException("categoryId không hợp lệ: " + dto.getCategoryId());
        }
        property.setCategoryId(category);
    }

    private void assertOwnerOrAdmin(Property property, Users currentUser) {
        if (currentUser == null) {
            throw new RuntimeException("Bạn cần đăng nhập");
        }
        boolean isAdmin = isAdminRole(currentUser.getUserRole());
        boolean isOwner = property.getSellerId() != null
                && property.getSellerId().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa tin này");
        }
    }

    private boolean isAdminRole(String role) {
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }
}
