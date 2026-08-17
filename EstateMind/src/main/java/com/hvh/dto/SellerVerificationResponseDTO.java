package com.hvh.dto;

import java.math.BigDecimal;
import java.util.Date;

public class SellerVerificationResponseDTO {

    private Integer id;

    private String bio;

    private Boolean isVerified;

    private Date verifiedAt;

    private BigDecimal ratingAvg;

    private Integer totalProperties;

    private Integer companyId;

    private String companyName;

    private Date createdAt;

    private Date updatedAt;

    public SellerVerificationResponseDTO() {}

    public SellerVerificationResponseDTO(
            Integer id,
            String bio,
            Boolean isVerified,
            Date verifiedAt,
            BigDecimal ratingAvg,
            Integer totalProperties,
            Integer companyId,
            String companyName,
            Date createdAt,
            Date updatedAt) {

        this.id = id;
        this.bio = bio;
        this.isVerified = isVerified;
        this.verifiedAt = verifiedAt;
        this.ratingAvg = ratingAvg;
        this.totalProperties = totalProperties;
        this.companyId = companyId;
        this.companyName = companyName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public Date getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Date verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public BigDecimal getRatingAvg() {
        return ratingAvg;
    }

    public void setRatingAvg(BigDecimal ratingAvg) {
        this.ratingAvg = ratingAvg;
    }

    public Integer getTotalProperties() {
        return totalProperties;
    }

    public void setTotalProperties(Integer totalProperties) {
        this.totalProperties = totalProperties;
    }

    public Integer getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Integer companyId) {
        this.companyId = companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
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
