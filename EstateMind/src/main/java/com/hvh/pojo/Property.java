/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.pojo;

import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
import java.math.BigDecimal;
import java.util.Date;
import java.util.Set;

/**
 *
 * @author acer
 */
@Entity
@Table(name = "property")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Property.findAll", query = "SELECT p FROM Property p"),
    @NamedQuery(name = "Property.findById", query = "SELECT p FROM Property p WHERE p.id = :id"),
    @NamedQuery(name = "Property.findByTitle", query = "SELECT p FROM Property p WHERE p.title = :title"),
    @NamedQuery(name = "Property.findByDescription", query = "SELECT p FROM Property p WHERE p.description = :description"),
    @NamedQuery(name = "Property.findByAddress", query = "SELECT p FROM Property p WHERE p.address = :address"),
    @NamedQuery(name = "Property.findByCity", query = "SELECT p FROM Property p WHERE p.city = :city"),
    @NamedQuery(name = "Property.findByDistrict", query = "SELECT p FROM Property p WHERE p.district = :district"),
    @NamedQuery(name = "Property.findByWard", query = "SELECT p FROM Property p WHERE p.ward = :ward"),
    @NamedQuery(name = "Property.findByPrice", query = "SELECT p FROM Property p WHERE p.price = :price"),
    @NamedQuery(name = "Property.findByArea", query = "SELECT p FROM Property p WHERE p.area = :area"),
    @NamedQuery(name = "Property.findByBedrooms", query = "SELECT p FROM Property p WHERE p.bedrooms = :bedrooms"),
    @NamedQuery(name = "Property.findByBathrooms", query = "SELECT p FROM Property p WHERE p.bathrooms = :bathrooms"),
    @NamedQuery(name = "Property.findByFloors", query = "SELECT p FROM Property p WHERE p.floors = :floors"),
    @NamedQuery(name = "Property.findByPropertyType", query = "SELECT p FROM Property p WHERE p.propertyType = :propertyType"),
    @NamedQuery(name = "Property.findByStatus", query = "SELECT p FROM Property p WHERE p.status = :status"),
    @NamedQuery(name = "Property.findByLatitude", query = "SELECT p FROM Property p WHERE p.latitude = :latitude"),
    @NamedQuery(name = "Property.findByLongitude", query = "SELECT p FROM Property p WHERE p.longitude = :longitude"),
    @NamedQuery(name = "Property.findByCreatedAt", query = "SELECT p FROM Property p WHERE p.createdAt = :createdAt"),
    @NamedQuery(name = "Property.findByUpdatedAt", query = "SELECT p FROM Property p WHERE p.updatedAt = :updatedAt")})
public class Property implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 255)
    @Column(name = "title")
    private String title;
    @Size(max = 2147483647)
    @Column(name = "description")
    private String description;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 2147483647)
    @Column(name = "address")
    private String address;
    @Size(max = 100)
    @Column(name = "city")
    private String city;
    @Size(max = 100)
    @Column(name = "district")
    private String district;
    @Size(max = 100)
    @Column(name = "ward")
    private String ward;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Basic(optional = false)
    @NotNull
    @Column(name = "price")
    private BigDecimal price;
    @Column(name = "area")
    private BigDecimal area;
    @Column(name = "bedrooms")
    private Integer bedrooms;
    @Column(name = "bathrooms")
    private Integer bathrooms;
    @Column(name = "floors")
    private Integer floors;
    @Size(max = 50)
    @Column(name = "property_type")
    private String propertyType;
    @Size(max = 30)
    @Column(name = "status")
    private String status;
    @Column(name = "latitude")
    private BigDecimal latitude;
    @Column(name = "longitude")
    private BigDecimal longitude;
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "propertyId")
    private Set<LegalDocument> legalDocumentSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "propertyId")
    private Set<PropertyImages> propertyImagesSet;
    @JoinColumn(name = "category_id", referencedColumnName = "id")
    @ManyToOne
    private Category categoryId;
    @JoinColumn(name = "seller_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private User sellerId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "propertyId")
    private Set<Comment> commentSet;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "propertyId")
    private Set<History> historySet;

    public Property() {
    }

    public Property(Integer id) {
        this.id = id;
    }

    public Property(Integer id, String title, String address, BigDecimal price) {
        this.id = id;
        this.title = title;
        this.address = address;
        this.price = price;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getWard() {
        return ward;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getArea() {
        return area;
    }

    public void setArea(BigDecimal area) {
        this.area = area;
    }

    public Integer getBedrooms() {
        return bedrooms;
    }

    public void setBedrooms(Integer bedrooms) {
        this.bedrooms = bedrooms;
    }

    public Integer getBathrooms() {
        return bathrooms;
    }

    public void setBathrooms(Integer bathrooms) {
        this.bathrooms = bathrooms;
    }

    public Integer getFloors() {
        return floors;
    }

    public void setFloors(Integer floors) {
        this.floors = floors;
    }

    public String getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(String propertyType) {
        this.propertyType = propertyType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
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
    public Set<LegalDocument> getLegalDocumentSet() {
        return legalDocumentSet;
    }

    public void setLegalDocumentSet(Set<LegalDocument> legalDocumentSet) {
        this.legalDocumentSet = legalDocumentSet;
    }

    @XmlTransient
    public Set<PropertyImages> getPropertyImagesSet() {
        return propertyImagesSet;
    }

    public void setPropertyImagesSet(Set<PropertyImages> propertyImagesSet) {
        this.propertyImagesSet = propertyImagesSet;
    }

    public Category getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Category categoryId) {
        this.categoryId = categoryId;
    }

    public User getSellerId() {
        return sellerId;
    }

    public void setSellerId(User sellerId) {
        this.sellerId = sellerId;
    }

    @XmlTransient
    public Set<Comment> getCommentSet() {
        return commentSet;
    }

    public void setCommentSet(Set<Comment> commentSet) {
        this.commentSet = commentSet;
    }

    @XmlTransient
    public Set<History> getHistorySet() {
        return historySet;
    }

    public void setHistorySet(Set<History> historySet) {
        this.historySet = historySet;
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
        if (!(object instanceof Property)) {
            return false;
        }
        Property other = (Property) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.hvh.pojo.Property[ id=" + id + " ]";
    }
    
}
