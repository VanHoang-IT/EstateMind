/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import java.util.List;
import org.springframework.http.MediaType;
import com.hvh.dto.PropertyRequestDTO;
import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import com.hvh.service.PropertyService;
import com.hvh.service.UserService;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 *
 * @author acer
 */
@Controller
@RequestMapping("/admin/properties")
@PreAuthorize("isFullyAuthenticated()")
public class AdminPropertyController {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private UserService userService;

    @GetMapping
    public String list(Model model, @RequestParam Map<String, String> params) {
        model.addAttribute("properties", this.propertyService.getProperties(params).getItems());
        if (!model.containsAttribute("property")) {
            model.addAttribute("property", new Property());
        }
        return "properties";
    }

    @GetMapping("/{id}")
    public String editForm(@PathVariable("id") Integer id, Model model, @RequestParam Map<String, String> params) {
        model.addAttribute("properties", this.propertyService.getProperties(params).getItems());
        try {
            model.addAttribute("property", this.propertyService.getPropertyById(id));
        } catch (RuntimeException e) {
            model.addAttribute("errMsg", e.getMessage());
            model.addAttribute("property", new Property());
        }
        return "properties";
    }

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public String create(
            @ModelAttribute PropertyRequestDTO dto,
            @RequestParam("mainImage") MultipartFile mainImage,
            @RequestParam(
                    value = "propertyImages",
                    required = false
            ) List<MultipartFile> propertyImages,
            Authentication auth,
            RedirectAttributes redirect) {

        try {
            Users currentUser = this.userService
                    .getUserByUsername(auth.getName());

            this.propertyService.createProperty(
                    dto,
                    currentUser,
                    mainImage,
                    propertyImages
            );

            redirect.addFlashAttribute(
                    "successMsg",
                    "Thêm bất động sản thành công!"
            );

        } catch (RuntimeException e) {
            redirect.addFlashAttribute(
                    "errMsg",
                    e.getMessage()
            );
        }

        return "redirect:/admin/properties";
    }

    @PostMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public String update(
            @PathVariable("id") Integer id,
            @ModelAttribute PropertyRequestDTO dto,
            @RequestParam(
                    value = "mainImage",
                    required = false
            ) MultipartFile mainImage,
            @RequestParam(
                    value = "propertyImages",
                    required = false
            ) List<MultipartFile> propertyImages,
            Authentication auth,
            RedirectAttributes redirect) {

        try {
            Users currentUser = this.userService
                    .getUserByUsername(auth.getName());

            this.propertyService.updateProperty(
                    id,
                    dto,
                    currentUser,
                    mainImage,
                    propertyImages
            );

            redirect.addFlashAttribute(
                    "successMsg",
                    "Cập nhật bất động sản #" + id
                    + " thành công!"
            );

        } catch (RuntimeException e) {
            redirect.addFlashAttribute(
                    "errMsg",
                    e.getMessage()
            );
        }

        return "redirect:/admin/properties";
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable("id") Integer id, Authentication auth, RedirectAttributes redirect) {
        try {
            Users currentUser = this.userService.getUserByUsername(auth.getName());
            this.propertyService.deleteProperty(id, currentUser);
            redirect.addFlashAttribute("successMsg", "Đã xoá bất động sản #" + id);
        } catch (RuntimeException e) {
            redirect.addFlashAttribute("errMsg", e.getMessage());
        }
        return "redirect:/admin/properties";
    }

    private PropertyRequestDTO toDto(Map<String, String> params) {
        PropertyRequestDTO dto = new PropertyRequestDTO();
        dto.setTitle(params.get("title"));
        dto.setDescription(params.get("description"));
        dto.setAddress(params.get("address"));
        dto.setDistrict(params.get("district"));

        String price = params.get("price");
        if (price != null && !price.isBlank()) {
            dto.setPrice(new BigDecimal(price));
        }
        String area = params.get("area");
        if (area != null && !area.isBlank()) {
            dto.setArea(new BigDecimal(area));
        }
        String bedrooms = params.get("bedrooms");
        if (bedrooms != null && !bedrooms.isBlank()) {
            dto.setBedrooms(Integer.parseInt(bedrooms));
        }
        String categoryId = params.get("categoryId");
        if (categoryId != null && !categoryId.isBlank()) {
            dto.setCategoryId(Integer.parseInt(categoryId));
        }
        return dto;
    }
}
