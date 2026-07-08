package com.hvh.controllers;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
import com.hvh.pojo.Property;
import com.hvh.service.CategoryService;
import com.hvh.service.PropertyService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;


/**
 *
 * @author acer
 */
@Controller
@RequestMapping("/admin")
public class PropertyController {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private CategoryService categoryService;

    @GetMapping("/properties")
    public String listProperties(Model model,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "kw", required = false) String kw,
            @RequestParam(name = "cateId", required = false) String cateId) {

        Map<String, String> params = new HashMap<>();
        params.put("page", String.valueOf(page));

        if (kw != null && !kw.isBlank())
            params.put("kw", kw);

        if (cateId != null && !cateId.isBlank())
            params.put("cateId", cateId);

        model.addAttribute("properties",
                this.propertyService.getProperties(params));

        model.addAttribute("categories",
                this.categoryService.getCates());

        model.addAttribute("property", new Property());

        model.addAttribute("page", page);
        model.addAttribute("kw", kw);
        model.addAttribute("cateId", cateId);

        return "properties";
    }

    @PostMapping("/properties")
    public String addProperty(Model model,
            @ModelAttribute(value = "property") Property property) {

        try {
            this.propertyService.addOrUpdateProperty(property);
            return "redirect:/admin/properties";

        } catch (Exception ex) {

            model.addAttribute("errMsg",
                    "Thêm bất động sản thất bại!");

            Map<String, String> params = new HashMap<>();
            params.put("page", "1");

            model.addAttribute("properties",
                    this.propertyService.getProperties(params));

            model.addAttribute("categories",
                    this.categoryService.getCates());

            return "properties";
        }
    }

    @GetMapping("/properties/{propertyId}")
    public String editProperty(Model model,
            @PathVariable(value = "propertyId") int id) {

        Map<String, String> params = new HashMap<>();
        params.put("page", "1");

        model.addAttribute("property",
                this.propertyService.getPropertyById(id));

        model.addAttribute("properties",
                this.propertyService.getProperties(params));

        model.addAttribute("categories",
                this.categoryService.getCates());

        model.addAttribute("page", 1);
        model.addAttribute("kw", null);
        model.addAttribute("cateId", null);

        return "properties";
    }

    @PostMapping("/properties/{propertyId}")
    public String updateProperty(Model model,
            @PathVariable(value = "propertyId") int id,
            @ModelAttribute(value = "property") Property property) {

        try {

            property.setId(id);

            this.propertyService.addOrUpdateProperty(property);

            return "redirect:/admin/properties";

        } catch (Exception ex) {

            model.addAttribute("errMsg",
                    "Cập nhật bất động sản thất bại!");

            Map<String, String> params = new HashMap<>();
            params.put("page", "1");

            model.addAttribute("properties",
                    this.propertyService.getProperties(params));

            model.addAttribute("categories",
                    this.categoryService.getCates());

            return "properties";
        }
    }
}