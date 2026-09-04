/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.service.impl;

import com.hvh.dto.CompanyRequestDTO;
import com.hvh.pojo.Company;
import com.hvh.repository.CompanyRepository;
import com.hvh.service.CompanyService;
import java.util.Date;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 *
 * @author acer
 */
@Service
public class CompanyServiceImpl implements CompanyService {
 
    @Autowired
    private CompanyRepository companyRepo;
 
    @Override
    public Company getCompanyById(int id) {
        return this.companyRepo.getCompanyById(id);
    }
 
    @Override
    public Company createOrReuseCompany(CompanyRequestDTO request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Tên công ty không được để trống");
        }
 
        String taxCode = request.getTaxCode() == null ? null : request.getTaxCode().trim();
        if (taxCode != null && !taxCode.isBlank()) {
            Company existing = this.companyRepo.getCompanyByTaxCode(taxCode);
            if (existing != null) {
                return existing;
            }
        }
 
        Company company = new Company();
        company.setName(request.getName().trim());
        company.setBusinessLicenseNumber(
                blankToNull(request.getBusinessLicenseNumber()));
        company.setTaxCode(blankToNull(taxCode));
        company.setAddress(blankToNull(request.getAddress()));
        company.setPhone(blankToNull(request.getPhone()));
        company.setEmail(blankToNull(request.getEmail()));
        company.setIsVerified(false);
        company.setCreatedAt(new Date());
        company.setUpdatedAt(new Date());
 
        return this.companyRepo.addOrUpdateCompany(company);
    }
 
    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}