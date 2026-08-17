/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * @author acer
 */
public class UpdateProfileDTO {

    @Size(max = 50, message = "Tên tối đa 50 ký tự")
    private String firstName;

    @Size(max = 50, message = "Họ tối đa 50 ký tự")
    private String lastName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email tối đa 100 ký tự")
    private String email;

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
}
