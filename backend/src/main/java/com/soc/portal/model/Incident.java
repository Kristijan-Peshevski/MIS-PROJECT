package com.soc.portal.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidenti")
public class Incident {
    @Id
    @Column(name = "incident_id")
    private String incidentId; // e.g. INC-2026-0001

    @Column(nullable = false)
    private String naslov;

    @Column(name = "tip_incident", nullable = false)
    private String tipIncident; // PHISHING, MALWARE, DDOS, UNAUTHORIZED_ACCESS

    @Lob
    @Column(columnDefinition = "TEXT")
    private String opis;

    @Column(nullable = false)
    private String status; // NEW, UNDER_INVESTIGATION, CLOSED

    @Column(nullable = false)
    private String itnost; // KRITICNA, VISOKA, SREDNA, NISKA

    @Column(name = "datum_kreiranje", nullable = false)
    private LocalDateTime datumKreiranje;

    @ManyToOne
    @JoinColumn(name = "korisnik_id", nullable = false)
    private Korisnik korisnik; // Reporter

    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset; // Affected asset

    @ManyToOne
    @JoinColumn(name = "dodelen_analitichar_id")
    private Korisnik dodelenAnalitichar; // Assigned Analyst

    public Incident() {}

    public String getIncidentId() { return incidentId; }
    public void setIncidentId(String incidentId) { this.incidentId = incidentId; }
    public String getNaslov() { return naslov; }
    public void setNaslov(String naslov) { this.naslov = naslov; }
    public String getTipIncident() { return tipIncident; }
    public void setTipIncident(String tipIncident) { this.tipIncident = tipIncident; }
    public String getOpis() { return opis; }
    public void setOpis(String opis) { this.opis = opis; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getItnost() { return itnost; }
    public void setItnost(String itnost) { this.itnost = itnost; }
    public LocalDateTime getDatumKreiranje() { return datumKreiranje; }
    public void setDatumKreiranje(LocalDateTime datumKreiranje) { this.datumKreiranje = datumKreiranje; }
    public Korisnik getKorisnik() { return korisnik; }
    public void setKorisnik(Korisnik korisnik) { this.korisnik = korisnik; }
    public Asset getAsset() { return asset; }
    public void setAsset(Asset asset) { this.asset = asset; }
    public Korisnik getDodelenAnalitichar() { return dodelenAnalitichar; }
    public void setDodelenAnalitichar(Korisnik dodelenAnalitichar) { this.dodelenAnalitichar = dodelenAnalitichar; }
}
