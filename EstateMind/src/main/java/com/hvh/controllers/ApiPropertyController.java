package com.hvh.controllers;

import com.hvh.dto.PageResponseDTO;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import com.hvh.service.PropertyService;
import com.hvh.service.UserService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
/**
 *
 * @author acer
 */
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

    @GetMapping("/properties")
    public ResponseEntity<PageResponseDTO<Property>> list(
            @RequestParam Map<String, String> params) {

        return ResponseEntity.ok(
                this.propertyService.getProperties(params)
        );
    }

    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<?> details(
            @PathVariable("propertyId") int id) {

        try {
            Property property
                    = this.propertyService.getPropertyById(id);

            return ResponseEntity.ok(property);

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            getMessage(e, "Không tìm thấy tin đăng")
                    ));

        } catch (RuntimeException e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            getMessage(
                                    e,
                                    "Không thể lấy thông tin tin đăng"
                            )
                    ));
        }
    }

    @PostMapping(
            value = "/secure/properties",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')")
    public ResponseEntity<?> create(
            @RequestPart("property") PropertyRequestDTO dto,
            @RequestPart("mainImage") MultipartFile mainImage,
            @RequestPart(
                    value = "propertyImages",
                    required = false
            ) java.util.List<MultipartFile> propertyImages,
            Authentication auth) {

        try {
            Users seller = this.userService
                    .getUserByUsername(auth.getName());

            Property created = this.propertyService
                    .createProperty(
                            dto,
                            seller,
                            mainImage,
                            propertyImages
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Đăng tin thành công",
                            "id", created.getId(),
                            "title", created.getTitle(),
                            "mainImage",
                            created.getMainImage() == null
                            ? ""
                            : created.getMainImage()
                    ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            getMessage(
                                    e,
                                    "Dữ liệu tin đăng không hợp lệ"
                            )
                    ));

        } catch (RuntimeException e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            getMessage(
                                    e,
                                    "Không thể tạo tin đăng"
                            )
                    ));
        }
    }

    @PutMapping(
            value = "/secure/properties/{propertyId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')")
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
            ) java.util.List<MultipartFile> propertyImages,
            Authentication auth) {

        try {
            Users currentUser = this.userService
                    .getUserByUsername(auth.getName());

            Property updated = this.propertyService
                    .updateProperty(
                            id,
                            dto,
                            currentUser,
                            mainImage,
                            propertyImages
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Cập nhật tin thành công",
                            "id", updated.getId(),
                            "title", updated.getTitle(),
                            "mainImage",
                            updated.getMainImage() == null
                            ? ""
                            : updated.getMainImage()
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            getMessage(
                                    e,
                                    "Dữ liệu cập nhật không hợp lệ"
                            )
                    ));

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            getMessage(
                                    e,
                                    "Bạn không có quyền cập nhật tin này"
                            )
                    ));
        }
    }

    @PostMapping(
            value = "/secure/properties/{propertyId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')")
    public ResponseEntity<?> uploadImage(
            @PathVariable("propertyId") int id,
            @RequestParam("file") MultipartFile file) {

        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Vui lòng chọn ảnh"
                        ));
            }

            this.propertyService.addPropertyImage(id, file);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message",
                            "Tải ảnh lên thành công",
                            "propertyId",
                            id
                    ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            getMessage(e, "Ảnh không hợp lệ")
                    ));

        } catch (RuntimeException e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            getMessage(
                                    e,
                                    "Không thể tải ảnh lên"
                            )
                    ));
        }
    }

    @DeleteMapping("/secure/properties/{propertyId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SELLER','ROLE_ADMIN')")
    public ResponseEntity<?> delete(
            @PathVariable("propertyId") int id,
            Authentication auth) {

        try {
            Users currentUser
                    = this.userService.getUserByUsername(
                            auth.getName()
                    );

            this.propertyService.deleteProperty(
                    id,
                    currentUser
            );

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            getMessage(
                                    e,
                                    "Bạn không có quyền xóa tin này"
                            )
                    ));
        }
    }

    private String getMessage(
            Exception exception,
            String defaultMessage) {

        String message = exception.getMessage();

        if (message == null || message.isBlank()) {
            return defaultMessage;
        }

        return message;
    }
}
