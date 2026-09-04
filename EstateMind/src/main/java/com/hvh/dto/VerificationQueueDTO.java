package com.hvh.dto;

import com.hvh.pojo.CustomerProfile;
import com.hvh.pojo.SellerProfile;
import java.util.Date;

public class VerificationQueueDTO {

    private Integer userId;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;

    // Customer
    private String address;
    private String identityNumber;

    // Seller
    private String bio;
    private String companyName;
    private String companyTaxCode;

    private Date updatedAt;

    public VerificationQueueDTO() {}

    public static VerificationQueueDTO fromCustomer(CustomerProfile profile) {
        VerificationQueueDTO dto = new VerificationQueueDTO();
        dto.userId = profile.getUsers().getId();
        dto.username = profile.getUsers().getUsername();
        dto.firstName = profile.getUsers().getFirstName();
        dto.lastName = profile.getUsers().getLastName();
        dto.email = profile.getUsers().getEmail();
        dto.phone = profile.getUsers().getPhone();
        dto.role = "ROLE_CUSTOMER";
        dto.address = profile.getAddress();
        dto.identityNumber = profile.getIdentityNumber();
        dto.updatedAt = profile.getUpdatedAt();
        return dto;
    }

    public static VerificationQueueDTO fromSeller(SellerProfile profile) {
        VerificationQueueDTO dto = new VerificationQueueDTO();
        dto.userId = profile.getUsers().getId();
        dto.username = profile.getUsers().getUsername();
        dto.firstName = profile.getUsers().getFirstName();
        dto.lastName = profile.getUsers().getLastName();
        dto.email = profile.getUsers().getEmail();
        dto.phone = profile.getUsers().getPhone();
        dto.role = "ROLE_SELLER";
        dto.bio = profile.getBio();
        if (profile.getCompanyId() != null) {
            dto.companyName = profile.getCompanyId().getName();
            dto.companyTaxCode = profile.getCompanyId().getTaxCode();
        }
        dto.updatedAt = profile.getUpdatedAt();
        return dto;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyTaxCode() {
        return companyTaxCode;
    }

    public void setCompanyTaxCode(String companyTaxCode) {
        this.companyTaxCode = companyTaxCode;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}