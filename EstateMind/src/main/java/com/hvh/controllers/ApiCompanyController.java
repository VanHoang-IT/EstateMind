package com.hvh.controllers;

import com.hvh.dto.CompanyRequestDTO;
import com.hvh.pojo.Company;
import com.hvh.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiCompanyController {

    @Autowired
    private CompanyService companyService;

    @PostMapping(
        value = "/secure/companies",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Company> createCompany(
            @Valid @RequestBody CompanyRequestDTO request) {
        try {
            Company company = this.companyService.createOrReuseCompany(request);
            return new ResponseEntity<>(company, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}