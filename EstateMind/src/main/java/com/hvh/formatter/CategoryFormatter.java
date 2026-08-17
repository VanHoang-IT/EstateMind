/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.formatter;

import com.hvh.pojo.Category;
import java.text.ParseException;
import java.util.Locale;
import org.springframework.format.Formatter;

/**
 * @author acer
 */
public class CategoryFormatter implements Formatter<Category> {

    @Override
    public String print(Category cate, Locale locale) {
        return String.valueOf(cate.getId());
    }

    @Override
    public Category parse(String cateId, Locale locale) throws ParseException {
        Category c = new Category();
        c.setId(Integer.valueOf(cateId));
        return c;
    }
}
