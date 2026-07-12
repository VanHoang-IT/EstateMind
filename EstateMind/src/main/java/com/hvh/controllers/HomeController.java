        /*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;

import com.hvh.service.CategoryService;
import com.hvh.service.PropertyService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
/**
 *
 * @author acer
 */
@Controller
@ControllerAdvice
public class HomeController {
    @Autowired
    private CategoryService cateService;
    @Autowired
    private PropertyService prodService;
    
    @ModelAttribute
    public void commonResponses(Model model) {
        model.addAttribute("categories", this.cateService.getCates());
    }
    
    @RequestMapping("/")
    public String index(Model model, @RequestParam Map<String, String> params) {
        
        model.addAttribute("properties", this.prodService.getProperties(params));
        return "index";
    }
}
