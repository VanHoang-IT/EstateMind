package com.hvh.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Category;
import com.hvh.pojo.Property;
import com.hvh.pojo.PropertyImages;
import com.hvh.pojo.Users;
import com.hvh.repository.CategoryRepository;
import com.hvh.repository.PropertyRepository;
import com.hvh.service.PropertyService;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PropertyServiceImpl implements PropertyService {

    private static final long MAX_IMAGE_SIZE
            = 5L * 1024L * 1024L;

    private static final int MAX_PROPERTY_IMAGES = 8;

    private static final Set<String> ALLOWED_IMAGE_TYPES
            = Set.of(
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/webp"
            );

    @Autowired
    private PropertyRepository propertyRepo;

    @Autowired
    private CategoryRepository categoryRepo;

    @Autowired
    private Cloudinary cloudinary;

    @Override
    public PageResponseDTO<Property> getProperties(
            Map<String, String> params) {

        List<Property> items
                = this.propertyRepo.getProperties(params);

        long total
                = this.propertyRepo.countProperties(params);

        int page = 1;
        int size = 10;

        if (params != null) {
            String pageParam = params.get("page");
            String sizeParam = params.get("size");

            if (pageParam != null && !pageParam.isBlank()) {
                try {
                    page = Math.max(
                            Integer.parseInt(pageParam),
                            1
                    );
                } catch (NumberFormatException ignored) {
                    page = 1;
                }
            }

            if (sizeParam != null && !sizeParam.isBlank()) {
                try {
                    size = Math.max(
                            Integer.parseInt(sizeParam),
                            1
                    );
                } catch (NumberFormatException ignored) {
                    size = 10;
                }
            }
        }

        return new PageResponseDTO<>(
                items,
                page,
                size,
                total
        );
    }

    @Override
    public Property getPropertyById(int id) {
        Property property
                = this.propertyRepo.getPropertyById(id);

        if (property == null) {
            throw new IllegalArgumentException(
                    "Không tìm thấy bất động sản với id " + id
            );
        }

        return property;
    }

    @Override
    @Transactional
    public Property createProperty(
            PropertyRequestDTO dto,
            Users seller) {

        validate(dto);

        if (seller == null || seller.getId() == null) {
            throw new IllegalArgumentException(
                    "Không xác định được người đăng tin"
            );
        }

        Property property = new Property();

        mapDtoToEntity(dto, property);

        property.setSellerId(seller);
        property.setStatus("PENDING");
        property.setLegalVerified(false);

        Date now = new Date();

        property.setCreatedAt(now);
        property.setUpdatedAt(now);

        this.propertyRepo.addOrUpdateProperty(property);

        return property;
    }

    @Override
    @Transactional
    public Property createProperty(
            PropertyRequestDTO dto,
            Users seller,
            MultipartFile mainImage,
            List<MultipartFile> propertyImages) {

        validateMainImage(mainImage);
        validatePropertyImages(propertyImages);

        Property property
                = this.createProperty(dto, seller);

        String mainImageUrl
                = uploadImageToCloudinary(mainImage);

        property.setMainImage(mainImageUrl);
        property.setUpdatedAt(new Date());

        this.propertyRepo.addOrUpdateProperty(property);

        saveDescriptionImages(
                property,
                propertyImages
        );

        return property;
    }

     @Override
    @Transactional
    public Property updateProperty(
            int id,
            PropertyRequestDTO dto,
            Users currentUser) {

        validate(dto);

        Property property
                = this.getPropertyById(id);

        assertOwnerOrAdmin(
                property,
                currentUser
        );

        boolean isAdmin = isAdminRole(currentUser.getUserRole());

        if (!isAdmin && !"PENDING".equalsIgnoreCase(property.getStatus())) {
            throw new IllegalArgumentException(
                    "Tin đã được duyệt, không thể chỉnh sửa"
            );
        }

        mapDtoToEntity(dto, property);

        if (isAdmin
                && dto.getStatus() != null
                && !dto.getStatus().isBlank()) {
            property.setStatus(dto.getStatus().trim().toUpperCase());
        }

        property.setUpdatedAt(new Date());

        this.propertyRepo.addOrUpdateProperty(property);

        return property;
    }

    @Override
    @Transactional
    public Property updateProperty(
            int id,
            PropertyRequestDTO dto,
            Users currentUser,
            MultipartFile mainImage,
            List<MultipartFile> propertyImages) {

        validatePropertyImages(propertyImages);

        Property property = this.updateProperty(
                id,
                dto,
                currentUser
        );

        if (mainImage != null && !mainImage.isEmpty()) {
            validateImage(mainImage);

            String mainImageUrl
                    = uploadImageToCloudinary(mainImage);

            property.setMainImage(mainImageUrl);
            property.setUpdatedAt(new Date());

            this.propertyRepo.addOrUpdateProperty(property);
        }

        saveDescriptionImages(
                property,
                propertyImages
        );

        return property;
    }

    @Override
    @Transactional
    public void deleteProperty(
            int id,
            Users currentUser) {

        Property property
                = this.getPropertyById(id);

        assertOwnerOrAdmin(
                property,
                currentUser
        );

        this.propertyRepo.deleteProperty(id);
    }

    @Override
    @Transactional
    public void addPropertyImage(
            int propertyId,
            MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return;
        }

        validateImage(file);

        Property property
                = this.getPropertyById(propertyId);

        saveDescriptionImage(
                property,
                file
        );
    }

    @Override
    @Transactional
    public void addPropertyImages(
            int propertyId,
            List<MultipartFile> files,
            Users currentUser) {

        Property property
                = this.getPropertyById(propertyId);

        assertOwnerOrAdmin(
                property,
                currentUser
        );

        validatePropertyImages(files);

        saveDescriptionImages(
                property,
                files
        );
    }

    private void saveDescriptionImages(
            Property property,
            List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            return;
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            saveDescriptionImage(
                    property,
                    file
            );
        }
    }

    private void saveDescriptionImage(
            Property property,
            MultipartFile file) {

        validateImage(file);

        String imageUrl
                = uploadImageToCloudinary(file);

        PropertyImages image
                = new PropertyImages();

        image.setPropertyId(property);
        image.setImageUrl(imageUrl);

        image.setIsPrimary(false);

        this.propertyRepo.addPropertyImage(image);
    }

    private String uploadImageToCloudinary(
            MultipartFile file) {

        validateImage(file);

        try {
            Map<?, ?> result
                    = this.cloudinary
                            .uploader()
                            .upload(
                                    file.getBytes(),
                                    ObjectUtils.asMap(
                                            "resource_type",
                                            "image",
                                            "folder",
                                            "estatemind/properties"
                                    )
                            );

            Object secureUrl
                    = result.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException(
                        "Cloudinary không trả về URL ảnh"
                );
            }

            return secureUrl.toString();

        } catch (IOException e) {
            throw new RuntimeException(
                    "Không thể tải ảnh lên Cloudinary",
                    e
            );
        }
    }

    private void validateMainImage(
            MultipartFile mainImage) {

        if (mainImage == null || mainImage.isEmpty()) {
            throw new IllegalArgumentException(
                    "Ảnh chính không được để trống"
            );
        }

        validateImage(mainImage);
    }

    private void validatePropertyImages(
            List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            return;
        }

        long validImageCount = files.stream()
                .filter(file
                        -> file != null && !file.isEmpty()
                )
                .count();

        if (validImageCount > MAX_PROPERTY_IMAGES) {
            throw new IllegalArgumentException(
                    "Chỉ được tải tối đa "
                    + MAX_PROPERTY_IMAGES
                    + " ảnh mô tả"
            );
        }

        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                validateImage(file);
            }
        }
    }

    private void validateImage(
            MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "File ảnh không được để trống"
            );
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Mỗi ảnh không được vượt quá 5 MB"
            );
        }

        String contentType
                = file.getContentType();

        if (contentType == null
                || !ALLOWED_IMAGE_TYPES.contains(
                        contentType.toLowerCase()
                )) {

            throw new IllegalArgumentException(
                    "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP"
            );
        }
    }

    private void validate(
            PropertyRequestDTO dto) {

        if (dto == null) {
            throw new IllegalArgumentException(
                    "Dữ liệu tin đăng không được để trống"
            );
        }

        if (dto.getTitle() == null
                || dto.getTitle().isBlank()) {

            throw new IllegalArgumentException(
                    "Tiêu đề không được để trống"
            );
        }

        if (dto.getTitle().trim().length() > 255) {
            throw new IllegalArgumentException(
                    "Tiêu đề tối đa 255 ký tự"
            );
        }

        if (dto.getAddress() == null
                || dto.getAddress().isBlank()) {

            throw new IllegalArgumentException(
                    "Địa chỉ không được để trống"
            );
        }

        if (dto.getPrice() == null
                || dto.getPrice().signum() <= 0) {

            throw new IllegalArgumentException(
                    "Giá phải lớn hơn 0"
            );
        }

        if (dto.getArea() != null
                && dto.getArea().signum() <= 0) {

            throw new IllegalArgumentException(
                    "Diện tích phải lớn hơn 0"
            );
        }

        if (dto.getBedrooms() != null
                && dto.getBedrooms() < 0) {

            throw new IllegalArgumentException(
                    "Số phòng ngủ không được âm"
            );
        }

        if (dto.getCategoryId() == null) {
            throw new IllegalArgumentException(
                    "Thiếu categoryId"
            );
        }
    }

    private void mapDtoToEntity(
            PropertyRequestDTO dto,
            Property property) {

        property.setTitle(
                dto.getTitle().trim()
        );

        property.setDescription(
                trimToNull(dto.getDescription())
        );

        property.setAddress(
                dto.getAddress().trim()
        );

        property.setPrice(
                dto.getPrice()
        );

        property.setArea(
                dto.getArea()
        );

        property.setDistrict(
                trimToNull(dto.getDistrict())
        );

        property.setBedrooms(
                dto.getBedrooms()
        );

        property.setLatitude(
                dto.getLatitude()
        );

        property.setLongitude(
                dto.getLongitude()
        );

        Category category
                = this.categoryRepo.getCategoryById(
                        dto.getCategoryId()
                );

        if (category == null) {
            throw new IllegalArgumentException(
                    "categoryId không hợp lệ: "
                    + dto.getCategoryId()
            );
        }

        property.setCategoryId(category);
    }

    private void assertOwnerOrAdmin(
            Property property,
            Users currentUser) {

        if (currentUser == null
                || currentUser.getId() == null) {

            throw new RuntimeException(
                    "Bạn cần đăng nhập"
            );
        }

        boolean isAdmin
                = isAdminRole(
                        currentUser.getUserRole()
                );

        boolean isOwner
                = property.getSellerId() != null
                && property.getSellerId().getId() != null
                && property.getSellerId()
                        .getId()
                        .equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException(
                    "Bạn không có quyền chỉnh sửa tin này"
            );
        }
    }

    private boolean isAdminRole(
            String role) {

        return "ADMIN".equalsIgnoreCase(role)
                || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    private String trimToNull(
            String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}