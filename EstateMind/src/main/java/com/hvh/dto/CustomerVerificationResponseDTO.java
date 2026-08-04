package com.hvh.dto;

import java.util.Date;

public class CustomerVerificationResponseDTO {

    private Integer id;
    private String address;
    private String identityNumber;
    private Boolean identityVerified;
    private Date createdAt;
    private Date updatedAt;

    public CustomerVerificationResponseDTO() {
    }

    public CustomerVerificationResponseDTO(
            Integer id,
            String address,
            String identityNumber,
            Boolean identityVerified,
            Date createdAt,
            Date updatedAt) {

        this.id = id;
        this.address = address;
        this.identityNumber = identityNumber;
        this.identityVerified = identityVerified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getIdentityNumber() {
        return identityNumber;
    }

    public void setIdentityNumber(String identityNumber) {
        this.identityNumber = identityNumber;
    }

    public Boolean getIdentityVerified() {
        return identityVerified;
    }

    public void setIdentityVerified(Boolean identityVerified) {
        this.identityVerified = identityVerified;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}