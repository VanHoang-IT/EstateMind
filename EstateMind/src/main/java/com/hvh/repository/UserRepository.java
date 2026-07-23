package com.hvh.repository;

import com.hvh.pojo.Users;
import java.util.List;

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
    Users getUserById(int id);
    Users addUser(Users u);
    boolean authenticate(String username, String password);
    List<Users> getUsers(Integer page);
    Users updateRole(int id, String role);
}