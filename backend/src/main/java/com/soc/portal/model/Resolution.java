package com.soc.portal.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resolutions")
public class Resolution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(nullable = false)
    private String dijagnoza; // TRUE_POSITIVE, FALSE_POSITIVE

    @Lob
    @Column(name = "prezemeni_chekori", columnDefinition = "TEXT", nullable = false)
    private String prezemeniChekori;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String preporaki;

    @Column(name = "datum_zatvoranje", nullable = false)
    private LocalDateTime datumZatvoranje;

    public Resolution() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public String getDijagnoza() { return dijagnoza; }
    public void setDijagnoza(String dijagnoza) { this.dijagnoza = dijagnoza; }
    public String getPrezemeniChekori() { return prezemeniChekori; }
    public void setPrezemeniChekori(String prezemeniChekori) { this.prezemeniChekori = prezemeniChekori; }
    public String getPreporaki() { return preporaki; }
    public void setPreporaki(String preporaki) { this.preporaki = preporaki; }
    public LocalDateTime getDatumZatvoranje() { return datumZatvoranje; }
    public void setDatumZatvoranje(LocalDateTime datumZatvoranje) { this.datumZatvoranje = datumZatvoranje; }
}
