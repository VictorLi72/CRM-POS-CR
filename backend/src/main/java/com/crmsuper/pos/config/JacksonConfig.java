package com.crmsuper.pos.config;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * El frontend (React) ya está escrito esperando los nombres de campo en
 * snake_case tal como los devolvía el backend Express (p. ej.
 * "nombre_completo", "precio_venta"), porque ahí coincidían con las columnas
 * de SQLite. Esta configuración hace que Jackson serialice/deserialice todos
 * los DTOs (escritos en camelCase, al estilo Java) como snake_case en el
 * JSON, para no tener que tocar el frontend.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilder jacksonObjectMapperBuilder() {
        Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();
        builder.propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        builder.findModulesViaServiceLoader(true);
        return builder;
    }
}
