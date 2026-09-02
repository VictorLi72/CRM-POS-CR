package com.crmsuper.pos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Se excluye {@link UserDetailsServiceAutoConfiguration} porque la
 * autenticación es 100% vía JWT propio (ver {@code security/}), no vía
 * UserDetailsService/login por formulario de Spring Security — sin esta
 * exclusión, Spring Boot genera igual un usuario/contraseña de desarrollo
 * que no se usa en ningún lado.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class PosBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PosBackendApplication.class, args);
    }
}
