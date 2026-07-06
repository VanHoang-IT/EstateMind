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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.Size;
import jakarta.xml.bind.annotation.XmlRootElement;
import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author acer
 */
@Entity
@Table(name = "legal_document")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "LegalDocument.findAll", query = "SELECT l FROM LegalDocument l"),
    @NamedQuery(name = "LegalDocument.findById", query = "SELECT l FROM LegalDocument l WHERE l.id = :id"),
    @NamedQuery(name = "LegalDocument.findByDocumentType", query = "SELECT l FROM LegalDocument l WHERE l.documentType = :documentType"),
    @NamedQuery(name = "LegalDocument.findByDocumentNumber", query = "SELECT l FROM LegalDocument l WHERE l.documentNumber = :documentNumber"),
    @NamedQuery(name = "LegalDocument.findByIssueDate", query = "SELECT l FROM LegalDocument l WHERE l.issueDate = :issueDate"),
    @NamedQuery(name = "LegalDocument.findByExpiryDate", query = "SELECT l FROM LegalDocument l WHERE l.expiryDate = :expiryDate"),
    @NamedQuery(name = "LegalDocument.findByFileUrl", query = "SELECT l FROM LegalDocument l WHERE l.fileUrl = :fileUrl"),
    @NamedQuery(name = "LegalDocument.findByVerified", query = "SELECT l FROM LegalDocument l WHERE l.verified = :verified")})
public class LegalDocument implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 100)
    @Column(name = "document_type")
    private String documentType;
    @Size(max = 100)
    @Column(name = "document_number")
    private String documentNumber;
    @Column(name = "issue_date")
    @Temporal(TemporalType.DATE)
    private Date issueDate;
    @Column(name = "expiry_date")
    @Temporal(TemporalType.DATE)
    private Date expiryDate;
    @Size(max = 2147483647)
    @Column(name = "file_url")
    private String fileUrl;
    @Column(name = "verified")
    private Boolean verified;
    @JoinColumn(name = "property_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Property propertyId;

    public LegalDocument() {
    }

    public LegalDocument(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public void setDocumentNumber(String documentNumber) {
        this.documentNumber = documentNumber;
    }

    public Date getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(Date issueDate) {
        this.issueDate = issueDate;
    }

    public Date getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Date expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public Property getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Property propertyId) {
        this.propertyId = propertyId;
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
        if (!(object instanceof LegalDocument)) {
            return false;
        }
        LegalDocument other = (LegalDocument) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.hvh.pojo.LegalDocument[ id=" + id + " ]";
    }
    
}
