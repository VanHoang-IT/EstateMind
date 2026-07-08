package com.hvh.repository;

import com.hvh.pojo.Users;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author acer
 */
public interface UserRepository {
    Users getUserByUsername(String username);
    Users addUser(Users u);
    boolean authenticate(String username, String password);
}