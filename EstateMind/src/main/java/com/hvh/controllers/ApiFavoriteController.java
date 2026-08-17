package com.hvh.controllers;

import com.hvh.pojo.Property;
import com.hvh.pojo.Users;
import com.hvh.service.FavoriteService;
import com.hvh.service.UserService;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/secure/favorites")
@CrossOrigin
@PreAuthorize(
        "hasAnyAuthority('ROLE_CUSTOMER', 'ROLE_SELLER')"
)
public class ApiFavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<Property>> list(
            Authentication auth
    ) {

        Users user
                = this.userService
                        .getUserByUsername(
                                auth.getName()
                        );

        return new ResponseEntity<>(
                this.favoriteService
                        .getFavoriteProperties(user),
                HttpStatus.OK
        );
    }

    @GetMapping("/{propertyId}/check")
    public ResponseEntity<Map<String, Boolean>> check(
            @PathVariable("propertyId") int propertyId,
            Authentication auth
    ) {

        Users user
                = this.userService
                        .getUserByUsername(
                                auth.getName()
                        );

        boolean favorited
                = this.favoriteService
                        .isFavorited(
                                user,
                                propertyId
                        );

        return new ResponseEntity<>(
                Collections.singletonMap(
                        "favorited",
                        favorited
                ),
                HttpStatus.OK
        );
    }

    @PostMapping("/{propertyId}")
    public ResponseEntity<?> add(
            @PathVariable("propertyId") int propertyId,
            Authentication auth
    ) {

        try {

            Users user
                    = this.userService
                            .getUserByUsername(
                                    auth.getName()
                            );

            this.favoriteService
                    .addFavorite(
                            user,
                            propertyId
                    );

            return new ResponseEntity<>(
                    HttpStatus.CREATED
            );

        } catch (IllegalArgumentException e) {

            return new ResponseEntity<>(
                    Map.of(
                            "message",
                            e.getMessage()
                    ),
                    HttpStatus.BAD_REQUEST
            );

        } catch (RuntimeException e) {

            return new ResponseEntity<>(
                    Map.of(
                            "message",
                            e.getMessage()
                    ),
                    HttpStatus.NOT_FOUND
            );
        }
    }

    @DeleteMapping("/{propertyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @PathVariable("propertyId") int propertyId,
            Authentication auth
    ) {

        Users user
                = this.userService
                        .getUserByUsername(
                                auth.getName()
                        );

        this.favoriteService
                .removeFavorite(
                        user,
                        propertyId
                );
    }
}
