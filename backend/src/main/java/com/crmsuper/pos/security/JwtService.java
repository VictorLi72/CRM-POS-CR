package com.crmsuper.pos.security;

import com.crmsuper.pos.model.Usuario;
import com.crmsuper.pos.model.enums.Rol;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationHours;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-hours}") long expirationHours
    ) {
        this.key = Keys.hmacShaKeyFor(sha256(secret));
        this.expirationHours = expirationHours;
    }

    // El secreto configurado puede tener cualquier longitud; se deriva una
    // clave HMAC-SHA256 de 256 bits a partir de él para cumplir con lo que
    // exige la librería jjwt.
    private static byte[] sha256(String secret) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public String generarToken(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("usuario", usuario.getUsuario())
                .claim("nombreCompleto", usuario.getNombreCompleto())
                .claim("rol", usuario.getRol().name())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(expirationHours, ChronoUnit.HOURS)))
                .signWith(key)
                .compact();
    }

    public AuthenticatedUser validarYExtraer(String token) throws JwtException {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        Long id = Long.valueOf(claims.getSubject());
        String usuario = claims.get("usuario", String.class);
        String nombreCompleto = claims.get("nombreCompleto", String.class);
        Rol rol = Rol.valueOf(claims.get("rol", String.class));
        return new AuthenticatedUser(id, usuario, nombreCompleto, rol);
    }
}
