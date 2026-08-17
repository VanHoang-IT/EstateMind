/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.hvh.utils;

/**
 * @author acer
 */
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.util.Date;

public class JwtUtils {
    private static final String SECRET = resolveSecret();

    private static final long EXPIRATION_MS = 86400000;

    private static String resolveSecret() {
        String fromEnv = System.getenv("JWT_SECRET");
        if (fromEnv != null && fromEnv.length() >= 32) {
            return fromEnv;
        }
        System.err.println(
                "[WARNING] JWT_SECRET env var not set (or too short, needs >= 32 chars). Using an"
                        + " insecure development-only fallback. Set JWT_SECRET before deploying.");
        return "dev-only-insecure-secret-32chars!!";
    }

    public static String generateToken(String username) throws Exception {
        JWSSigner signer = new MACSigner(SECRET);

        JWTClaimsSet claimsSet =
                new JWTClaimsSet.Builder()
                        .subject(username)
                        .expirationTime(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                        .issueTime(new Date())
                        .build();

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);

        signedJWT.sign(signer);

        return signedJWT.serialize();
    }

    public static String validateTokenAndGetUsername(String token) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(SECRET);

        if (signedJWT.verify(verifier)) {
            Date expiration = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expiration.after(new Date())) {
                return signedJWT.getJWTClaimsSet().getSubject();
            }
        }
        return null;
    }
}
