/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.hvh.pojo.PropertyType;
import com.hvh.service.PropertyTypeService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author acer
 */
@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiPropertyTypeController {

    @Autowired
    private PropertyTypeService propertyTypeService;

    @GetMapping("/property-types")
    public ResponseEntity<List<PropertyType>> list() {
        return new ResponseEntity<>(this.propertyTypeService.getPropertyTypes(), HttpStatus.OK);
    }

    @GetMapping("/property-types/{id}")
    public ResponseEntity<?> detail(@PathVariable("id") int id) {
        PropertyType type = this.propertyTypeService.getPropertyTypeById(id);
        if (type == null) {
            return new ResponseEntity<>("Không tìm thấy loại hình với id " + id, HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(type, HttpStatus.OK);
    }
}
