/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.xml.bind.annotation.XmlRootElement;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * @author acer
 */
@Entity
@Table(name = "seller_profile")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "SellerProfile.findAll", query = "SELECT s FROM SellerProfile s"),
    @NamedQuery(
            name = "SellerProfile.findById",
            query = "SELECT s FROM SellerProfile s WHERE s.id = :id"),
    @NamedQuery(
            name = "SellerProfile.findByBio",
            query = "SELECT s FROM SellerProfile s WHERE s.bio = :bio"),
    @NamedQuery(
            name = "SellerProfile.findByIsVerified",
            query = "SELECT s FROM SellerProfile s WHERE s.isVerified = :isVerified"),
    @NamedQuery(
            name = "SellerProfile.findByVerifiedAt",
            query = "SELECT s FROM SellerProfile s WHERE s.verifiedAt = :verifiedAt"),
    @NamedQuery(
            name = "SellerProfile.findByRatingAvg",
            query = "SELECT s FROM SellerProfile s WHERE s.ratingAvg = :ratingAvg"),
    @NamedQuery(
            name = "SellerProfile.findByTotalProperties",
            query = "SELECT s FROM SellerProfile s WHERE s.totalProperties = :totalProperties"),
    @NamedQuery(
            name = "SellerProfile.findByCreatedAt",
            query = "SELECT s FROM SellerProfile s WHERE s.createdAt = :createdAt"),
    @NamedQuery(
            name = "SellerProfile.findByUpdatedAt",
            query = "SELECT s FROM SellerProfile s WHERE s.updatedAt = :updatedAt")
})
public class SellerProfile implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Basic(optional = false)
    @NotNull
    @Column(name = "id")
    private Integer id;

    @Size(max = 2147483647)
    @Column(name = "bio")
    private String bio;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "verified_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date verifiedAt;

    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these
    // annotations to enforce field validation
    @Column(name = "rating_avg")
    private BigDecimal ratingAvg;

    @Column(name = "total_properties")
    private Integer totalProperties;

    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne
    private Company companyId;

    @JoinColumn(name = "id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private Users users;

    public SellerProfile() {}

    public SellerProfile(Integer id) {
        this.id = id;
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

    public Company getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Company companyId) {
        this.companyId = companyId;
    }

    public Users getUsers() {
        return users;
    }

    public void setUsers(Users users) {
        this.users = users;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof SellerProfile)) {
            return false;
        }
        SellerProfile other = (SellerProfile) object;
        if ((this.id == null && other.id != null)
                || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.hvh.pojo.SellerProfile[ id=" + id + " ]";
    }
}
