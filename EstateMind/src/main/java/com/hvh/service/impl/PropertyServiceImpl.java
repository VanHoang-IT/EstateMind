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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@PropertySource("classpath:configs.properties")
public class PropertyServiceImpl implements PropertyService {

    private static final int DEFAULT_PAGE_SIZE = 10;

    private static final int MAX_PAGE_SIZE = 50;

    private static final long MAX_IMAGE_SIZE = 5L * 1024L * 1024L;

    private static final int MAX_PROPERTY_IMAGES = 8;

    private static final Set<String> ALLOWED_LISTING_STATUSES
            = Set.of(
                    "AVAILABLE",
                    "RENT",
                    "SOLD"
            );

    private static final Set<String> ALLOWED_IMAGE_TYPES
            = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    @Autowired
    private PropertyRepository propertyRepo;

    @Autowired
    private CategoryRepository categoryRepo;

    @Autowired
    private Cloudinary cloudinary;

    @Autowired
    private Environment env;

    @Override
    public PageResponseDTO<Property> getProperties(Map<String, String> params) {

        int page = resolvePage(params);
        int size = resolvePageSize(params);

        Map<String, String> normalizedParams
                = params == null
                        ? new HashMap<>()
                        : new HashMap<>(params);

        normalizedParams.put(
                "page",
                String.valueOf(page)
        );

        normalizedParams.put(
                "size",
                String.valueOf(size)
        );

        List<Property> items
                = this.propertyRepo
                        .getProperties(
                                normalizedParams
                        );

        long total
                = this.propertyRepo
                        .countProperties(
                                normalizedParams
                        );

        return new PageResponseDTO<>(
                items,
                page,
                size,
                total
        );
    }

    private int resolvePage(
            Map<String, String> params
    ) {

        if (params == null) {
            return 1;
        }

        Integer page
                = parsePositiveInteger(
                        params.get("page")
                );

        return page == null
                ? 1
                : page;
    }

    private int resolvePageSize(
            Map<String, String> params
    ) {

        int defaultSize
                = getConfiguredPageSize();

        if (params == null) {
            return defaultSize;
        }

        Integer requestedSize
                = parsePositiveInteger(
                        params.get("size")
                );

        if (requestedSize == null) {
            return defaultSize;
        }

        return Math.min(
                requestedSize,
                MAX_PAGE_SIZE
        );
    }

    private int getConfiguredPageSize() {

        Integer configuredSize
                = env.getProperty(
                        "properties.page_size",
                        Integer.class,
                        DEFAULT_PAGE_SIZE
                );

        if (configuredSize == null
                || configuredSize < 1) {

            return DEFAULT_PAGE_SIZE;
        }

        return Math.min(
                configuredSize,
                MAX_PAGE_SIZE
        );
    }

    private Integer parsePositiveInteger(
            String value
    ) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        try {

            int parsed
                    = Integer.parseInt(
                            value.trim()
                    );

            return parsed < 1
                    ? null
                    : parsed;

        } catch (NumberFormatException e) {

            return null;
        }
    }

    @Override
    public Property getPropertyById(int id) {
        Property property = this.propertyRepo.getPropertyById(id);

        if (property == null) {
            throw new IllegalArgumentException("Không tìm thấy bất động sản với id " + id);
        }

        return property;
    }

    @Override
    @Transactional
    public Property createProperty(PropertyRequestDTO dto, Users seller) {

        validate(dto);

        if (seller == null || seller.getId() == null) {
            throw new IllegalArgumentException("Không xác định được người đăng tin");
        }

        Property property = new Property();

        mapDtoToEntity(dto, property);

        property.setSellerId(seller);

        property.setStatus(
                normalizeListingStatus(dto.getStatus())
        );

        property.setModerationStatus("PENDING");

        property.setRejectionReason(null);

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

        Property property = this.createProperty(dto, seller);

        String mainImageUrl = uploadImageToCloudinary(mainImage);

        property.setMainImage(mainImageUrl);
        property.setUpdatedAt(new Date());

        this.propertyRepo.addOrUpdateProperty(property);

        saveDescriptionImages(property, propertyImages);

        return property;
    }

    @Override
    @Transactional
    public Property updateProperty(
            int id,
            PropertyRequestDTO dto,
            Users currentUser
    ) {

        validate(dto);

        Property property
                = this.getPropertyById(id);

        assertOwnerOrAdmin(
                property,
                currentUser
        );

        boolean isAdmin
                = isAdminRole(
                        currentUser.getUserRole()
                );

        String moderationStatus
                = normalizeModerationStatus(
                        property.getModerationStatus()
                );

        if (!isAdmin
                && !"PENDING".equals(moderationStatus)
                && !"REJECTED".equals(moderationStatus)) {

            throw new IllegalArgumentException(
                    "Tin đã được duyệt, không thể chỉnh sửa"
            );
        }

        mapDtoToEntity(
                dto,
                property
        );

        if (dto.getStatus() != null
                && !dto.getStatus().isBlank()) {

            property.setStatus(
                    normalizeListingStatus(
                            dto.getStatus()
                    )
            );
        }

        if (!isAdmin
                && "REJECTED".equals(moderationStatus)) {

            property.setModerationStatus(
                    "PENDING"
            );

            property.setRejectionReason(null);

            property.setLegalVerified(false);
        }

        property.setUpdatedAt(
                new Date()
        );

        this.propertyRepo
                .addOrUpdateProperty(property);

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

        Property property = this.updateProperty(id, dto, currentUser);

        if (mainImage != null && !mainImage.isEmpty()) {
            validateImage(mainImage);

            String mainImageUrl = uploadImageToCloudinary(mainImage);

            property.setMainImage(mainImageUrl);
            property.setUpdatedAt(new Date());

            this.propertyRepo.addOrUpdateProperty(property);
        }

        saveDescriptionImages(property, propertyImages);

        return property;
    }

    @Override
    @Transactional
    public void deleteProperty(int id, Users currentUser) {

        Property property = this.getPropertyById(id);

        assertOwnerOrAdmin(property, currentUser);

        this.propertyRepo.deleteProperty(id);
    }

    @Override
    @Transactional
    public void addPropertyImage(int propertyId, MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return;
        }

        validateImage(file);

        Property property = this.getPropertyById(propertyId);

        saveDescriptionImage(property, file);
    }

    @Override
    @Transactional
    public void addPropertyImages(int propertyId, List<MultipartFile> files, Users currentUser) {

        Property property = this.getPropertyById(propertyId);

        assertOwnerOrAdmin(property, currentUser);

        validatePropertyImages(files);

        saveDescriptionImages(property, files);
    }

    private void saveDescriptionImages(Property property, List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            return;
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            saveDescriptionImage(property, file);
        }
    }

    private void saveDescriptionImage(Property property, MultipartFile file) {

        validateImage(file);

        String imageUrl = uploadImageToCloudinary(file);

        PropertyImages image = new PropertyImages();

        image.setPropertyId(property);
        image.setImageUrl(imageUrl);

        image.setIsPrimary(false);

        this.propertyRepo.addPropertyImage(image);
    }

    private String uploadImageToCloudinary(MultipartFile file) {

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
                                            "estatemind/properties"));

            Object secureUrl = result.get("secure_url");

            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary không trả về URL ảnh");
            }

            return secureUrl.toString();

        } catch (IOException e) {
            throw new RuntimeException("Không thể tải ảnh lên Cloudinary", e);
        }
    }

    private void validateMainImage(MultipartFile mainImage) {

        if (mainImage == null || mainImage.isEmpty()) {
            throw new IllegalArgumentException("Ảnh chính không được để trống");
        }

        validateImage(mainImage);
    }

    private void validatePropertyImages(List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            return;
        }

        long validImageCount
                = files.stream().filter(file -> file != null && !file.isEmpty()).count();

        if (validImageCount > MAX_PROPERTY_IMAGES) {
            throw new IllegalArgumentException(
                    "Chỉ được tải tối đa " + MAX_PROPERTY_IMAGES + " ảnh mô tả");
        }

        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                validateImage(file);
            }
        }
    }

    private void validateImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không được để trống");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Mỗi ảnh không được vượt quá 5 MB");
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {

            throw new IllegalArgumentException("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
        }
    }

    private void validate(PropertyRequestDTO dto) {

        if (dto == null) {
            throw new IllegalArgumentException("Dữ liệu tin đăng không được để trống");
        }

        if (dto.getTitle() == null || dto.getTitle().isBlank()) {

            throw new IllegalArgumentException("Tiêu đề không được để trống");
        }

        if (dto.getTitle().trim().length() > 255) {
            throw new IllegalArgumentException("Tiêu đề tối đa 255 ký tự");
        }

        if (dto.getAddress() == null || dto.getAddress().isBlank()) {

            throw new IllegalArgumentException("Địa chỉ không được để trống");
        }

        if (dto.getPrice() == null || dto.getPrice().signum() <= 0) {

            throw new IllegalArgumentException("Giá phải lớn hơn 0");
        }

        if (dto.getArea() != null && dto.getArea().signum() <= 0) {

            throw new IllegalArgumentException("Diện tích phải lớn hơn 0");
        }

        if (dto.getBedrooms() != null && dto.getBedrooms() < 0) {

            throw new IllegalArgumentException("Số phòng ngủ không được âm");
        }

        if (dto.getCategoryId() == null) {
            throw new IllegalArgumentException("Thiếu categoryId");
        }
    }

    private void mapDtoToEntity(PropertyRequestDTO dto, Property property) {

        property.setTitle(dto.getTitle().trim());

        property.setDescription(trimToNull(dto.getDescription()));

        property.setAddress(dto.getAddress().trim());

        property.setPrice(dto.getPrice());

        property.setArea(dto.getArea());

        property.setDistrict(trimToNull(dto.getDistrict()));

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

        if (currentUser == null || currentUser.getId() == null) {

            throw new RuntimeException("Bạn cần đăng nhập");
        }

        boolean isAdmin = isAdminRole(currentUser.getUserRole());

        boolean isOwner
                = property.getSellerId() != null
                && property.getSellerId().getId() != null
                && property.getSellerId().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa tin này");
        }
    }

    private boolean isAdminRole(String role) {

        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    private String trimToNull(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    @Override
    @Transactional
    public Property approveProperty(
            int id,
            Users admin
    ) {

        assertAdmin(admin);

        Property property
                = this.getPropertyById(id);

        property.setModerationStatus(
                "APPROVED"
        );

        property.setRejectionReason(null);
        property.setLegalVerified(true);

        property.setUpdatedAt(
                new Date()
        );

        this.propertyRepo
                .addOrUpdateProperty(property);

        return property;
    }

    @Override
    @Transactional
    public Property rejectProperty(
            int id,
            Users admin,
            String reason
    ) {

        assertAdmin(admin);

        String normalizedReason
                = trimToNull(reason);

        if (normalizedReason == null) {

            throw new IllegalArgumentException(
                    "Lý do từ chối không được để trống"
            );
        }

        if (normalizedReason.length() > 1000) {

            throw new IllegalArgumentException(
                    "Lý do từ chối tối đa 1000 ký tự"
            );
        }

        Property property
                = this.getPropertyById(id);

        property.setModerationStatus(
                "REJECTED"
        );

        property.setRejectionReason(
                normalizedReason
        );

        property.setLegalVerified(false);

        property.setUpdatedAt(
                new Date()
        );

        this.propertyRepo
                .addOrUpdateProperty(property);

        return property;
    }

    private void assertAdmin(
            Users currentUser
    ) {

        if (currentUser == null
                || currentUser.getId() == null
                || !isAdminRole(
                        currentUser.getUserRole()
                )) {

            throw new RuntimeException(
                    "Bạn không có quyền quản trị"
            );
        }
    }

    private String normalizeListingStatus(
            String status
    ) {

        if (status == null
                || status.isBlank()) {

            return "AVAILABLE";
        }

        String normalized
                = status
                        .trim()
                        .toUpperCase();

        if (!ALLOWED_LISTING_STATUSES
                .contains(normalized)) {

            throw new IllegalArgumentException(
                    "Trạng thái tin không hợp lệ: "
                    + status
            );
        }

        return normalized;
    }

    private String normalizeModerationStatus(
            String status
    ) {

        if (status == null
                || status.isBlank()) {

            return "PENDING";
        }

        return status
                .trim()
                .toUpperCase();
    }
}
