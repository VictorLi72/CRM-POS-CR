package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.BitacoraResponse;
import com.crmsuper.pos.model.Bitacora;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.repository.BitacoraRepository;
import com.crmsuper.pos.repository.UsuarioRepository;
import com.crmsuper.pos.service.AuditoriaService;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditoriaServiceImpl implements AuditoriaService {

    private final BitacoraRepository bitacoraRepository;
    private final UsuarioRepository usuarioRepository;
    private final NamedParameterJdbcTemplate jdbc;

    public AuditoriaServiceImpl(BitacoraRepository bitacoraRepository, UsuarioRepository usuarioRepository,
                                 NamedParameterJdbcTemplate jdbc) {
        this.bitacoraRepository = bitacoraRepository;
        this.usuarioRepository = usuarioRepository;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(Long usuarioId, String usuarioNombre, TipoAccion accion, String entidad, Long entidadId,
                           String detalle) {
        bitacoraRepository.save(Bitacora.builder()
                .usuario(usuarioId != null ? usuarioRepository.getReferenceById(usuarioId) : null)
                .usuarioNombre(usuarioNombre)
                .accion(accion)
                .entidad(entidad)
                .entidadId(entidadId)
                .detalle(detalle)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BitacoraResponse> listar(Long usuarioId, String entidad, TipoAccion accion, String from, String to) {
        StringBuilder sql = new StringBuilder("SELECT * FROM bitacora WHERE 1=1");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (usuarioId != null) {
            sql.append(" AND usuario_id = :usuarioId");
            params.addValue("usuarioId", usuarioId);
        }
        if (entidad != null && !entidad.isBlank()) {
            sql.append(" AND entidad = :entidad");
            params.addValue("entidad", entidad);
        }
        if (accion != null) {
            sql.append(" AND accion = :accion");
            params.addValue("accion", accion.name());
        }
        if (from != null && !from.isBlank()) {
            sql.append(" AND creado_en >= :from");
            params.addValue("from", from);
        }
        if (to != null && !to.isBlank()) {
            sql.append(" AND creado_en <= :to");
            params.addValue("to", to);
        }
        sql.append(" ORDER BY creado_en DESC LIMIT 500");

        return jdbc.query(sql.toString(), params, (rs, n) -> BitacoraResponse.builder()
                .id(rs.getLong("id"))
                .usuarioId(rs.getObject("usuario_id") != null ? rs.getLong("usuario_id") : null)
                .usuarioNombre(rs.getString("usuario_nombre"))
                .accion(TipoAccion.valueOf(rs.getString("accion")))
                .entidad(rs.getString("entidad"))
                .entidadId(rs.getObject("entidad_id") != null ? rs.getLong("entidad_id") : null)
                .detalle(rs.getString("detalle"))
                .creadoEn(rs.getTimestamp("creado_en").toInstant())
                .build());
    }
}
