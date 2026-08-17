/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.pojo.Category;
import com.hvh.repository.CategoryRepository;
import com.hvh.service.CategoryService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author acer
 */
@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository cateRepo;

    @Override
    public List<Category> getCates() {
        return this.cateRepo.getCates();
    }

    @Override
    public Category getCategoryById(int id) {
        return this.cateRepo.getCategoryById(id);
    }

    @Override
    public Category addOrUpdateCategory(Category category) {
        if (category.getName() == null || category.getName().isBlank()) {
            throw new IllegalArgumentException("Tên danh mục không được để trống");
        }
        return this.cateRepo.addOrUpdateCategory(category);
    }

    @Override
    public void deleteCategory(int id) {
        this.cateRepo.deleteCategory(id);
    }
}
