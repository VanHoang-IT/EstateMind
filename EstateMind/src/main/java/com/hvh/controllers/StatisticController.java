/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.controllers;
import com.hvh.service.StatisticService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
/**
 *
 * @author acer
 */
@Controller
@RequestMapping("/admin/statistics")
@PreAuthorize("isFullyAuthenticated()")
public class StatisticController {
    @Autowired
    private StatisticService statisticService;
    @GetMapping
    public String statistics(Model model) {
        long total = statisticService.countProperties();
        List<Object[]> byModeration = statisticService.getPropertiesByModerationStatus();
        long pending = 0, approved = 0, rejected = 0;
        for (Object[] row : byModeration) {
            String status = (String) row[0];
            long count = (Long) row[1];
            if ("PENDING".equals(status)) pending = count;
            else if ("APPROVED".equals(status)) approved = count;
            else if ("REJECTED".equals(status)) rejected = count;
        }
        model.addAttribute("totalProperties", total);
        model.addAttribute("pendingCount", pending);
        model.addAttribute("approvedCount", approved);
        model.addAttribute("rejectedCount", rejected);
        model.addAttribute("byModeration", byModeration);
        return "statistics";
    }
}