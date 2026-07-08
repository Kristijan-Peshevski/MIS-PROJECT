package com.soc.portal.repository;

import com.soc.portal.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, String> {
    List<Incident> findAllByOrderByDatumKreiranjeDesc();
    
    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status = 'NEW'")
    long countNewIncidents();

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status = 'UNDER_INVESTIGATION'")
    long countUnderInvestigationIncidents();

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status = 'CLOSED'")
    long countClosedIncidents();
}
