package com.soc.portal.model;

import jakarta.persistence.*;

@Entity
@Table(name = "assets")
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ime_sredstvo", nullable = false)
    private String imeSredstvo;

    @Column(name = "ip_adresa", nullable = false)
    private String ipAdresa;

    @Column(nullable = false)
    private String kritichnost; // KRITICNA, VISOKA, SREDNA, NISKA

    public Asset() {}

    public Asset(String imeSredstvo, String ipAdresa, String kritichnost) {
        this.imeSredstvo = imeSredstvo;
        this.ipAdresa = ipAdresa;
        this.kritichnost = kritichnost;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getImeSredstvo() { return imeSredstvo; }
    public void setImeSredstvo(String imeSredstvo) { this.imeSredstvo = imeSredstvo; }
    public String getIpAdresa() { return ipAdresa; }
    public void setIpAdresa(String ipAdresa) { this.ipAdresa = ipAdresa; }
    public String getKritichnost() { return kritichnost; }
    public void setKritichnost(String kritichnost) { this.kritichnost = kritichnost; }
}
