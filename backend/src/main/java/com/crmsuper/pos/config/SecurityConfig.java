package com.crmsuper.pos.config;

import com.crmsuper.pos.security.CustomAccessDeniedHandler;
import com.crmsuper.pos.security.CustomAuthenticationEntryPoint;
import com.crmsuper.pos.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Traduce a reglas de Spring Security las mismas comprobaciones de
 * requireAuth()/requireRole(...) que tenía cada archivo de rutas en el
 * backend Express. El orden de las reglas importa: gana la primera que haga
 * match, igual que el orden de los router.METHOD(...) originales.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] ADMIN = {"ADMINISTRADOR"};
    private static final String[] ADMIN_SUPERVISOR = {"ADMINISTRADOR", "SUPERVISOR"};

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomAuthenticationEntryPoint authenticationEntryPoint,
            CustomAccessDeniedHandler accessDeniedHandler
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        // archivos estáticos del frontend (React)
                        .requestMatchers("/", "/index.html", "/assets/**", "/favicon.ico").permitAll()

                        // públicas
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()

                        // productos y categorías
                        .requestMatchers(HttpMethod.POST, "/api/products/categories").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers(HttpMethod.DELETE, "/api/products/categories/*").hasAnyRole(ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/products/*/stock").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers(HttpMethod.POST, "/api/products").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers(HttpMethod.PUT, "/api/products/*").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers(HttpMethod.DELETE, "/api/products/*").hasAnyRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/products/**").authenticated()

                        // clientes
                        .requestMatchers(HttpMethod.DELETE, "/api/customers/*").hasAnyRole(ADMIN)
                        .requestMatchers("/api/customers/**").authenticated()

                        // ventas
                        .requestMatchers(HttpMethod.POST, "/api/sales/*/cancel").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers(HttpMethod.POST, "/api/sales/*/devolucion").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers("/api/sales/**").authenticated()

                        // reportes: todo admin/supervisor
                        .requestMatchers("/api/reports/**").hasAnyRole(ADMIN_SUPERVISOR)

                        // usuarios: todo admin
                        .requestMatchers("/api/users/**").hasAnyRole(ADMIN)

                        // bitácora de auditoría: solo admin
                        .requestMatchers("/api/audit/**").hasAnyRole(ADMIN)

                        // turnos de caja
                        .requestMatchers(HttpMethod.GET, "/api/turnos").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers("/api/turnos/**").authenticated()

                        // tarifas de iva
                        .requestMatchers(HttpMethod.POST, "/api/tax-rates").hasAnyRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/tax-rates/*").hasAnyRole(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/tax-rates/*").hasAnyRole(ADMIN)
                        .requestMatchers("/api/tax-rates/**").authenticated()

                        // descuentos
                        .requestMatchers(HttpMethod.POST, "/api/discounts").hasAnyRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/discounts/*").hasAnyRole(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/discounts/*").hasAnyRole(ADMIN)
                        .requestMatchers("/api/discounts/**").authenticated()

                        // promociones: cualquiera autenticado lee, admin/supervisor administran
                        .requestMatchers(HttpMethod.POST, "/api/promotions").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers(HttpMethod.PUT, "/api/promotions/*").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers(HttpMethod.DELETE, "/api/promotions/*").hasAnyRole(ADMIN_SUPERVISOR)
                        .requestMatchers("/api/promotions/**").authenticated()

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
