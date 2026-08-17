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
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.xml.bind.annotation.XmlRootElement;
import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author acer
 */
@Entity
@Table(name = "article")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Article.findAll", query = "SELECT a FROM Article a"),
    @NamedQuery(name = "Article.findById", query = "SELECT a FROM Article a WHERE a.id = :id"),
    @NamedQuery(name = "Article.findByTitle", query = "SELECT a FROM Article a WHERE a.title = :title"),
    @NamedQuery(name = "Article.findBySummary", query = "SELECT a FROM Article a WHERE a.summary = :summary"),
    @NamedQuery(name = "Article.findByCategory", query = "SELECT a FROM Article a WHERE a.category = :category"),
    @NamedQuery(name = "Article.findByImageUrl", query = "SELECT a FROM Article a WHERE a.imageUrl = :imageUrl"),
    @NamedQuery(name = "Article.findBySourceName", query = "SELECT a FROM Article a WHERE a.sourceName = :sourceName"),
    @NamedQuery(name = "Article.findBySourceUrl", query = "SELECT a FROM Article a WHERE a.sourceUrl = :sourceUrl"),
    @NamedQuery(name = "Article.findByPublishedAt", query = "SELECT a FROM Article a WHERE a.publishedAt = :publishedAt"),
    @NamedQuery(name = "Article.findByArticleType", query = "SELECT a FROM Article a WHERE a.articleType = :articleType"),
    @NamedQuery(name = "Article.findByCreatedAt", query = "SELECT a FROM Article a WHERE a.createdAt = :createdAt"),
    @NamedQuery(name = "Article.findByUpdatedAt", query = "SELECT a FROM Article a WHERE a.updatedAt = :updatedAt")})
public class Article implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Long id;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 255)
    @Column(name = "title")
    private String title;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 2147483647)
    @Column(name = "summary")
    private String summary;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 100)
    @Column(name = "category")
    private String category;
    @Size(max = 2147483647)
    @Column(name = "image_url")
    private String imageUrl;
    @Size(max = 150)
    @Column(name = "source_name")
    private String sourceName;
    @Size(max = 2147483647)
    @Column(name = "source_url")
    private String sourceUrl;
    @Basic(optional = false)
    @NotNull
    @Column(name = "published_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date publishedAt;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 30)
    @Column(name = "article_type")
    private String articleType;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    public Article() {
    }

    public Article(Long id) {
        this.id = id;
    }

    public Article(Long id, String title, String summary, String category, Date publishedAt, String articleType, Date createdAt, Date updatedAt) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.publishedAt = publishedAt;
        this.articleType = articleType;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public Date getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Date publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getArticleType() {
        return articleType;
    }

    public void setArticleType(String articleType) {
        this.articleType = articleType;
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

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Article)) {
            return false;
        }
        Article other = (Article) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.hvh.pojo.Article[ id=" + id + " ]";
    }
    
}
