package com.soc.portal.model;

import jakarta.persistence.*;

@Entity
@Table(name = "korisnici")
public class Korisnik {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ime;

    @Column(nullable = false)
    private String prezime;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String uloga; // KORISNIK, ANALITICAR, MENADZER

    @Column(nullable = true)
    private String lozinka;

    public Korisnik() {}

    public Korisnik(String ime, String prezime, String email, String uloga) {
        this.ime = ime;
        this.prezime = prezime;
        this.email = email;
        this.uloga = uloga;
        this.lozinka = "postgres";
    }

    public Korisnik(String ime, String prezime, String email, String uloga, String lozinka) {
        this.ime = ime;
        this.prezime = prezime;
        this.email = email;
        this.uloga = uloga;
        this.lozinka = lozinka;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIme() { return ime; }
    public void setIme(String ime) { this.ime = ime; }
    public String getPrezime() { return prezime; }
    public void setPrezime(String prezime) { this.prezime = prezime; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getUloga() { return uloga; }
    public void setUloga(String uloga) { this.uloga = uloga; }
    public String getLozinka() { return lozinka; }
    public void setLozinka(String lozinka) { this.lozinka = lozinka; }
}
