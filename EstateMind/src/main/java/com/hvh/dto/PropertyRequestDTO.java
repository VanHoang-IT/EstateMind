package com.hvh.dto;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
public class PropertyRequestDTO {
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;
    private String description;
    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;
    @NotNull(message = "Giá không được để trống")
    @DecimalMin(
            value = "0",
            inclusive = false,
            message = "Giá phải lớn hơn 0"
    )
    private BigDecimal price;
    @DecimalMin(
            value = "0",
            inclusive = false,
            message = "Diện tích phải lớn hơn 0"
    )
    private BigDecimal area;
    @Size(max = 100, message = "Quận/Huyện tối đa 100 ký tự")
    private String district;
    @Min(value = 0, message = "Số phòng ngủ không được âm")
    private Integer bedrooms;
    @DecimalMin(value = "-90", message = "Vĩ độ không hợp lệ")
    @DecimalMax(value = "90", message = "Vĩ độ không hợp lệ")
    private BigDecimal latitude;
    @DecimalMin(value = "-180", message = "Kinh độ không hợp lệ")
    @DecimalMax(value = "180", message = "Kinh độ không hợp lệ")
    private BigDecimal longitude;
    @NotNull(message = "Loại bất động sản không được để trống")
    private Integer categoryId;
    private String status;
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
    public String getDistrict() {
        return district;
    }
    public void setDistrict(String district) {
        this.district = district;
    }
    public Integer getBedrooms() {
        return bedrooms;
    }
    public void setBedrooms(Integer bedrooms) {
        this.bedrooms = bedrooms;
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
    public Integer getCategoryId() {
        return categoryId;
    }
    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

}