package com.hvh.controllers;

import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import com.hvh.service.PropertyService;
import com.hvh.service.SemanticSearchService;
import com.hvh.service.UserService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(
        value = "/api",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@CrossOrigin
public class ApiPropertyController {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private UserService userService;

    @Autowired
    private SemanticSearchService semanticSearchService;

    @GetMapping("/properties")
    public ResponseEntity<PageResponseDTO<Property>> list(
            @RequestParam Map<String, String> params
    ) {

        Map<String, String> publicParams
                = new HashMap<>(params);

        publicParams.put(
                "moderationStatus",
                "APPROVED"
        );

        return ResponseEntity.ok(
                this.propertyService
                        .getProperties(publicParams)
        );
    }

    @GetMapping("/properties/search")
    public ResponseEntity<PageResponseDTO<Property>> semanticSearch(
            @RequestParam("q") String query,
            @RequestParam(value = "limit", defaultValue = "12") int limit
    ) {

        int safeLimit
                = limit <= 0
                ? 12
                : Math.min(limit, 50);

        List<Integer> propertyIds
                = this.semanticSearchService
                        .searchPropertyIds(query, safeLimit);

        List<Property> items
                = this.findApprovedInOrder(propertyIds);

        return ResponseEntity.ok(
                new PageResponseDTO<>(
                        items,
                        1,
                        safeLimit,
                        items.size()
                )
        );
    }

    @GetMapping("/properties/batch")
    public ResponseEntity<List<Property>> batch(
            @RequestParam(value = "ids", required = false) List<Integer> ids
    ) {

        return ResponseEntity.ok(
                this.findApprovedInOrder(ids)
        );
    }

    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<?> details(
            @PathVariable("propertyId") int id
    ) {

        try {

            Property property
                    = this.propertyService
                            .getPropertyById(id);

            if (!"APPROVED".equalsIgnoreCase(
                    String.valueOf(
                            property.getModerationStatus()
                    )
            )) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(
                                Map.of(
                                        "message",
                                        "Không tìm thấy tin đăng"
                                )
                        );
            }

            return ResponseEntity.ok(property);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Không tìm thấy tin đăng"
                                    )
                            )
                    );

        } catch (RuntimeException e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Không thể lấy thông tin tin đăng"
                                    )
                            )
                    );
        }
    }

    @GetMapping("/secure/properties/mine")
    @PreAuthorize(
            "hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')"
    )
    public ResponseEntity<?> mine(
            @RequestParam Map<String, String> params,
            Authentication auth
    ) {

        try {

            Users seller
                    = this.userService
                            .getUserByUsername(
                                    auth.getName()
                            );

            Map<String, String> secureParams
                    = new HashMap<>(params);

            secureParams.put(
                    "sellerId",
                    String.valueOf(
                            seller.getId()
                    )
            );

            return ResponseEntity.ok(
                    this.propertyService
                            .getProperties(
                                    secureParams
                            )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Không thể tải tin của bạn"
                                    )
                            )
                    );
        }
    }

    @PostMapping(
            value = "/secure/properties",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize(
            "hasAuthority('ROLE_SELLER')"
    )
    public ResponseEntity<?> create(
            @RequestPart("property") PropertyRequestDTO dto,
            @RequestPart("mainImage") MultipartFile mainImage,
            @RequestPart(
                    value = "propertyImages",
                    required = false
            ) List<MultipartFile> propertyImages,
            Authentication auth
    ) {

        try {

            Users seller
                    = this.userService
                            .getUserByUsername(
                                    auth.getName()
                            );

            Property created
                    = this.propertyService
                            .createProperty(
                                    dto,
                                    seller,
                                    mainImage,
                                    propertyImages
                            );

            Map<String, Object> response
                    = new HashMap<>();

            response.put(
                    "message",
                    "Đăng tin thành công, đang chờ quản trị viên duyệt"
            );

            response.put(
                    "id",
                    created.getId()
            );

            response.put(
                    "title",
                    created.getTitle()
            );

            response.put(
                    "mainImage",
                    created.getMainImage() == null
                    ? ""
                    : created.getMainImage()
            );

            response.put(
                    "moderationStatus",
                    created.getModerationStatus()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Dữ liệu tin đăng không hợp lệ"
                                    )
                            )
                    );

        } catch (RuntimeException e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Không thể tạo tin đăng"
                                    )
                            )
                    );
        }
    }

    @PutMapping(
            value = "/secure/properties/{propertyId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize(
            "hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')"
    )
    public ResponseEntity<?> update(
            @PathVariable("propertyId") int id,
            @RequestPart("property") PropertyRequestDTO dto,
            @RequestPart(
                    value = "mainImage",
                    required = false
            ) MultipartFile mainImage,
            @RequestPart(
                    value = "propertyImages",
                    required = false
            ) List<MultipartFile> propertyImages,
            Authentication auth
    ) {

        try {

            Users currentUser
                    = this.userService
                            .getUserByUsername(
                                    auth.getName()
                            );

            Property updated
                    = this.propertyService
                            .updateProperty(
                                    id,
                                    dto,
                                    currentUser,
                                    mainImage,
                                    propertyImages
                            );

            Map<String, Object> response
                    = new HashMap<>();

            response.put(
                    "message",
                    "Cập nhật tin thành công"
            );

            response.put(
                    "id",
                    updated.getId()
            );

            response.put(
                    "title",
                    updated.getTitle()
            );

            response.put(
                    "mainImage",
                    updated.getMainImage() == null
                    ? ""
                    : updated.getMainImage()
            );

            response.put(
                    "moderationStatus",
                    updated.getModerationStatus()
            );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Dữ liệu cập nhật không hợp lệ"
                                    )
                            )
                    );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Bạn không có quyền cập nhật tin này"
                                    )
                            )
                    );
        }
    }

    @PostMapping(
            value = "/secure/properties/{propertyId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize(
            "hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')"
    )
    public ResponseEntity<?> uploadImages(
            @PathVariable("propertyId") int id,
            @RequestParam("propertyImages") List<MultipartFile> files,
            Authentication auth
    ) {

        try {

            if (files == null
                    || files.isEmpty()) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                Map.of(
                                        "message",
                                        "Vui lòng chọn ít nhất một ảnh"
                                )
                        );
            }

            Users currentUser
                    = this.userService
                            .getUserByUsername(
                                    auth.getName()
                            );

            this.propertyService
                    .addPropertyImages(
                            id,
                            new ArrayList<>(files),
                            currentUser
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            Map.of(
                                    "message",
                                    "Tải ảnh lên thành công",
                                    "propertyId",
                                    id,
                                    "imageCount",
                                    files.size()
                            )
                    );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Ảnh không hợp lệ"
                                    )
                            )
                    );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Không thể tải ảnh lên"
                                    )
                            )
                    );
        }
    }

    @DeleteMapping(
            "/secure/properties/{propertyId}"
    )
    @PreAuthorize(
            "hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')"
    )
    public ResponseEntity<?> delete(
            @PathVariable("propertyId") int id,
            Authentication auth
    ) {

        try {

            Users currentUser
                    = this.userService
                            .getUserByUsername(
                                    auth.getName()
                            );

            this.propertyService
                    .deleteProperty(
                            id,
                            currentUser
                    );

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            Map.of(
                                    "message",
                                    getMessage(
                                            e,
                                            "Bạn không có quyền xóa tin này"
                                    )
                            )
                    );
        }
    }

    private List<Property> findApprovedInOrder(
            List<Integer> ids
    ) {

        List<Property> result
                = new ArrayList<>();

        if (ids == null
                || ids.isEmpty()) {

            return result;
        }

        for (Integer id : ids) {

            if (id == null) {
                continue;
            }

            try {

                Property property
                        = this.propertyService
                                .getPropertyById(id);

                if (property != null
                        && "APPROVED".equalsIgnoreCase(
                                String.valueOf(
                                        property.getModerationStatus()
                                )
                        )) {

                    result.add(property);
                }

            } catch (RuntimeException e) {
                continue;
            }
        }

        return result;
    }

    private String getMessage(
            Exception exception,
            String defaultMessage
    ) {

        String message
                = exception.getMessage();

        if (message == null
                || message.isBlank()) {

            return defaultMessage;
        }

        return message;
    }
}