/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.hvh.service;
import java.util.List;
public interface StatisticService {
    long countProperties();
    List<Object[]> getPropertiesByModerationStatus();
}