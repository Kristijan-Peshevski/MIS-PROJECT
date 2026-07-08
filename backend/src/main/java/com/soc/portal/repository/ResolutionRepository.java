package com.soc.portal.repository;

import com.soc.portal.model.Resolution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ResolutionRepository extends JpaRepository<Resolution, Long> {
    Optional<Resolution> findByIncidentIncidentId(String incidentId);
}
