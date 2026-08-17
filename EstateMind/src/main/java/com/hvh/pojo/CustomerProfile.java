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
import java.util.Date;

/**
 * @author acer
 */
@Entity
@Table(name = "customer_profile")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "CustomerProfile.findAll", query = "SELECT c FROM CustomerProfile c"),
    @NamedQuery(
            name = "CustomerProfile.findById",
            query = "SELECT c FROM CustomerProfile c WHERE c.id = :id"),
    @NamedQuery(
            name = "CustomerProfile.findByAddress",
            query = "SELECT c FROM CustomerProfile c WHERE c.address = :address"),
    @NamedQuery(
            name = "CustomerProfile.findByIdentityNumber",
            query = "SELECT c FROM CustomerProfile c WHERE c.identityNumber = :identityNumber"),
    @NamedQuery(
            name = "CustomerProfile.findByIdentityVerified",
            query = "SELECT c FROM CustomerProfile c WHERE c.identityVerified = :identityVerified"),
    @NamedQuery(
            name = "CustomerProfile.findByCreatedAt",
            query = "SELECT c FROM CustomerProfile c WHERE c.createdAt = :createdAt"),
    @NamedQuery(
            name = "CustomerProfile.findByUpdatedAt",
            query = "SELECT c FROM CustomerProfile c WHERE c.updatedAt = :updatedAt")
})
public class CustomerProfile implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Basic(optional = false)
    @NotNull
    @Column(name = "id")
    private Integer id;

    @Size(max = 2147483647)
    @Column(name = "address")
    private String address;

    @Size(max = 50)
    @Column(name = "identity_number")
    private String identityNumber;

    @Column(name = "identity_verified")
    private Boolean identityVerified;

    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @JoinColumn(name = "id", referencedColumnName = "id", insertable = false, updatable = false)
    @OneToOne(optional = false)
    private Users users;

    public CustomerProfile() {}

    public CustomerProfile(Integer id) {
        this.id = id;
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
        if (!(object instanceof CustomerProfile)) {
            return false;
        }
        CustomerProfile other = (CustomerProfile) object;
        if ((this.id == null && other.id != null)
                || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.hvh.pojo.CustomerProfile[ id=" + id + " ]";
    }
}
