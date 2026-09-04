/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlTransient;
import java.io.Serializable;
import java.util.Date;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * @author acer
 */
@Entity
@Table(name = "company")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Company.findAll", query = "SELECT c FROM Company c"),
    @NamedQuery(name = "Company.findById", query = "SELECT c FROM Company c WHERE c.id = :id"),
    @NamedQuery(
            name = "Company.findByName",
            query = "SELECT c FROM Company c WHERE c.name = :name"),
    @NamedQuery(
            name = "Company.findByBusinessLicenseNumber",
            query =
                    "SELECT c FROM Company c WHERE c.businessLicenseNumber ="
                            + " :businessLicenseNumber"),
    @NamedQuery(
            name = "Company.findByTaxCode",
            query = "SELECT c FROM Company c WHERE c.taxCode = :taxCode"),
    @NamedQuery(
            name = "Company.findByAddress",
            query = "SELECT c FROM Company c WHERE c.address = :address"),
    @NamedQuery(
            name = "Company.findByPhone",
            query = "SELECT c FROM Company c WHERE c.phone = :phone"),
    @NamedQuery(
            name = "Company.findByEmail",
            query = "SELECT c FROM Company c WHERE c.email = :email"),
    @NamedQuery(
            name = "Company.findByLogoUrl",
            query = "SELECT c FROM Company c WHERE c.logoUrl = :logoUrl"),
    @NamedQuery(
            name = "Company.findByIsVerified",
            query = "SELECT c FROM Company c WHERE c.isVerified = :isVerified"),
    @NamedQuery(
            name = "Company.findByCreatedAt",
            query = "SELECT c FROM Company c WHERE c.createdAt = :createdAt"),
    @NamedQuery(
            name = "Company.findByUpdatedAt",
            query = "SELECT c FROM Company c WHERE c.updatedAt = :updatedAt")
})
public class Company implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;

    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 255)
    @Column(name = "name")
    private String name;

    @Size(max = 100)
    @Column(name = "business_license_number")
    private String businessLicenseNumber;

    @Size(max = 50)
    @Column(name = "tax_code")
    private String taxCode;

    @Size(max = 2147483647)
    @Column(name = "address")
    private String address;

    // @Pattern(regexp="^\\(?(\\d{3})\\)?[- ]?(\\d{3})[- ]?(\\d{4})$", message="Invalid phone/fax
    // format, should be as xxx-xxx-xxxx")//if the field contains phone or fax number consider using
    // this annotation to enforce field validation
    @Size(max = 20)
    @Column(name = "phone")
    private String phone;

    // @Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation
    @Size(max = 255)
    @Column(name = "email")
    private String email;

    @Size(max = 2147483647)
    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @OneToMany(mappedBy = "companyId")
    private Set<SellerProfile> sellerProfileSet;

    public Company() {}

    public Company(Integer id) {
        this.id = id;
    }

    public Company(Integer id, String name) {
        this.id = id;
        this.name = name;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBusinessLicenseNumber() {
        return businessLicenseNumber;
    }

    public void setBusinessLicenseNumber(String businessLicenseNumber) {
        this.businessLicenseNumber = businessLicenseNumber;
    }

    public String getTaxCode() {
        return taxCode;
    }

    public void setTaxCode(String taxCode) {
        this.taxCode = taxCode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
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

    @XmlTransient
    @JsonIgnore
    public Set<SellerProfile> getSellerProfileSet() {
        return sellerProfileSet;
    }

    public void setSellerProfileSet(Set<SellerProfile> sellerProfileSet) {
        this.sellerProfileSet = sellerProfileSet;
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
        if (!(object instanceof Company)) {
            return false;
        }
        Company other = (Company) object;
        if ((this.id == null && other.id != null)
                || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.hvh.pojo.Company[ id=" + id + " ]";
    }
}
