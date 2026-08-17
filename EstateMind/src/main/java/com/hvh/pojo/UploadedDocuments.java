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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.xml.bind.annotation.XmlRootElement;
import java.io.Serializable;
import java.util.Date;

/**
 * @author acer
 */
@Entity
@Table(name = "uploaded_documents")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "UploadedDocuments.findAll", query = "SELECT u FROM UploadedDocuments u"),
    @NamedQuery(
            name = "UploadedDocuments.findById",
            query = "SELECT u FROM UploadedDocuments u WHERE u.id = :id"),
    @NamedQuery(
            name = "UploadedDocuments.findByFileName",
            query = "SELECT u FROM UploadedDocuments u WHERE u.fileName = :fileName"),
    @NamedQuery(
            name = "UploadedDocuments.findByFilePath",
            query = "SELECT u FROM UploadedDocuments u WHERE u.filePath = :filePath"),
    @NamedQuery(
            name = "UploadedDocuments.findByFileType",
            query = "SELECT u FROM UploadedDocuments u WHERE u.fileType = :fileType"),
    @NamedQuery(
            name = "UploadedDocuments.findByStatus",
            query = "SELECT u FROM UploadedDocuments u WHERE u.status = :status"),
    @NamedQuery(
            name = "UploadedDocuments.findByUploadedDate",
            query = "SELECT u FROM UploadedDocuments u WHERE u.uploadedDate = :uploadedDate")
})
public class UploadedDocuments implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;

    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 255)
    @Column(name = "file_name")
    private String fileName;

    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 2147483647)
    @Column(name = "file_path")
    private String filePath;

    @Size(max = 50)
    @Column(name = "file_type")
    private String fileType;

    @Size(max = 30)
    @Column(name = "status")
    private String status;

    @Column(name = "uploaded_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date uploadedDate;

    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Users userId;

    public UploadedDocuments() {}

    public UploadedDocuments(Integer id) {
        this.id = id;
    }

    public UploadedDocuments(Integer id, String fileName, String filePath) {
        this.id = id;
        this.fileName = fileName;
        this.filePath = filePath;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getUploadedDate() {
        return uploadedDate;
    }

    public void setUploadedDate(Date uploadedDate) {
        this.uploadedDate = uploadedDate;
    }

    public Users getUserId() {
        return userId;
    }

    public void setUserId(Users userId) {
        this.userId = userId;
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
        if (!(object instanceof UploadedDocuments)) {
            return false;
        }
        UploadedDocuments other = (UploadedDocuments) object;
        if ((this.id == null && other.id != null)
                || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.hvh.pojo.UploadedDocuments[ id=" + id + " ]";
    }
}
