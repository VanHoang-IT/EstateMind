/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import java.util.List;

/**
 *
 * @author acer
 */
public interface SemanticSearchService {
    List<Integer> searchPropertyIds(String query, int limit);
}
