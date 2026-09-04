/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;
import com.hvh.repository.StatisticRepository;
import com.hvh.service.StatisticService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 *
 * @author acer
 */
@Service
public class StatisticServiceImpl implements StatisticService {
    @Autowired
    private StatisticRepository statisticRepository;
    @Override
    public long countProperties() {
        return this.statisticRepository.countProperties();
    }
    @Override
    public List<Object[]> getPropertiesByModerationStatus() {
        return this.statisticRepository.getPropertiesByModerationStatus();
    }
}