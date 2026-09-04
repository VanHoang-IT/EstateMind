/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository;

import com.hvh.pojo.Company;

/**
 *
 * @author acer
 */
public interface CompanyRepository {
    Company getCompanyById(int id);
    Company getCompanyByTaxCode(String taxCode);
    Company addOrUpdateCompany(Company company);
}