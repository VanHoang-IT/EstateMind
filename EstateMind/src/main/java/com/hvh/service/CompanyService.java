/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service;

import com.hvh.dto.CompanyRequestDTO;
import com.hvh.pojo.Company;
/**
 *
 * @author acer
 */
public interface CompanyService {
    Company getCompanyById(int id);
    Company createOrReuseCompany(CompanyRequestDTO request);
}
