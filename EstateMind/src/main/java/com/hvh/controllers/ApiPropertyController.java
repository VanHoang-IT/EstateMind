package com.hvh.controllers;

import com.hvh.pojo.Property;
import com.hvh.service.PropertyService;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author acer
 */
@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiPropertyController {

    @Autowired
    private PropertyService propertyService;

    @GetMapping("/properties")
    public ResponseEntity<List<Property>> list(@RequestParam Map<String, String> params) {
        return new ResponseEntity<>(this.propertyService.getProperties(params), HttpStatus.OK);
    }

    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<Property> details(@PathVariable(value = "propertyId") int id) {
        return new ResponseEntity<>(this.propertyService.getPropertyById(id), HttpStatus.OK);
    }

    @DeleteMapping("/properties/{propertyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable(value = "propertyId") int id) {
        this.propertyService.deleteProperty(id);
    }
}
