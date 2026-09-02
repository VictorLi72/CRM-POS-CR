package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.FolioCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface FolioCounterRepository extends JpaRepository<FolioCounter, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<FolioCounter> findById(Long id);
}
