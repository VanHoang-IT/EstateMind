/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PropertyRejectionRequestDTO {

    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(
            max = 1000,
            message = "Lý do từ chối tối đa 1000 ký tự"
    )
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
