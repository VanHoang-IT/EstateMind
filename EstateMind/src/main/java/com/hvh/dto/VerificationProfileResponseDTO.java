package com.hvh.dto;

public class VerificationProfileResponseDTO<T> {

    private String role;

    private T profile;

    public VerificationProfileResponseDTO() {}

    public VerificationProfileResponseDTO(String role, T profile) {

        this.role = role;
        this.profile = profile;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public T getProfile() {
        return profile;
    }

    public void setProfile(T profile) {
        this.profile = profile;
    }
}
