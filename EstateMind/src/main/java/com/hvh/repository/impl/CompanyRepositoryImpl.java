/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.repository.impl;

import com.hvh.pojo.Company;
import com.hvh.repository.CompanyRepository;
import java.util.List;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
/**
 *
 * @author acer
 */
@Repository
@Transactional
public class CompanyRepositoryImpl implements CompanyRepository {
    @Autowired
    private LocalSessionFactoryBean factory;
 
    @Override
    public Company getCompanyById(int id) {
        Session session = this.factory.getObject().getCurrentSession();
        return session.get(Company.class, id);
    }
 
    @Override
    public Company getCompanyByTaxCode(String taxCode) {
        Session session = this.factory.getObject().getCurrentSession();
        Query<Company> query =
                session.createNamedQuery("Company.findByTaxCode", Company.class);
        query.setParameter("taxCode", taxCode);
        List<Company> results = query.getResultList();
        return results.isEmpty() ? null : results.get(0);
    }
 
    @Override
    public Company addOrUpdateCompany(Company company) {
        Session session = this.factory.getObject().getCurrentSession();
        if (company.getId() == null) {
            session.persist(company);
        } else {
            session.merge(company);
        }
        return company;
    }
}
 
