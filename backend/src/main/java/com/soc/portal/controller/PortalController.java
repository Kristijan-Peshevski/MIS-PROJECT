package com.soc.portal.controller;

import com.soc.portal.model.*;
import com.soc.portal.odoo.OdooClient;
import com.soc.portal.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PortalController {

    private static final Logger log = LoggerFactory.getLogger(PortalController.class);

    /** Мапирање на критичност на ИТ средството -> Odoo приоритет (0..3). */
    private static final Map<String, Integer> KRITICHNOST_TO_PRIORITY = Map.of(
            "KRITICNA", 3,
            "VISOKA",   2,
            "SREDNA",   1,
            "NISKA",    0
    );

    @Autowired
    private KorisnikRepository korisnikRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private ResolutionRepository resolutionRepository;

    @Autowired(required = false)
    private OdooClient odooClient;  // Може да биде null ако Odoo не е конфигуриран.

    // --- AUTHENTICATION ---

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String lozinka = payload.get("lozinka");

        if (email == null || email.trim().isEmpty() || lozinka == null || lozinka.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Е-поштата и лозинката се задолжителни.");
        }

        String cleanEmail = email.trim().toLowerCase();
        String cleanPassword = lozinka.trim();

        Optional<Korisnik> userOpt = korisnikRepository.findAll().stream()
                .filter(u -> u.getEmail().trim().equalsIgnoreCase(cleanEmail) && u.getLozinka() != null && u.getLozinka().trim().equals(cleanPassword))
                .findFirst();

        if (userOpt.isEmpty()) {
            boolean emailExists = korisnikRepository.findAll().stream()
                    .anyMatch(u -> u.getEmail().trim().equalsIgnoreCase(cleanEmail));
            if (!emailExists) {
                return ResponseEntity.status(401).body("Корисникот со оваа е-пошта не постои.");
            }
            return ResponseEntity.status(401).body("Погрешна лозинка. Ве молиме обидете се повторно.");
        }

        return ResponseEntity.ok(userOpt.get());
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String ime = payload.get("ime");
        String prezime = payload.get("prezime");
        String email = payload.get("email");
        String lozinka = payload.get("lozinka");
        String uloga = payload.get("uloga");

        if (ime == null || ime.trim().isEmpty() ||
            prezime == null || prezime.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            lozinka == null || lozinka.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Сите полиња се задолжителни (Име, Презиме, Е-пошта, Лозинка).");
        }

        if (korisnikRepository.existsByEmail(email.trim())) {
            return ResponseEntity.badRequest().body("Корисник со оваа е-пошта веќе постои.");
        }

        String finalUloga = (uloga != null && !uloga.trim().isEmpty()) ? uloga.trim().toUpperCase() : "KORISNIK";
        Korisnik newUser = new Korisnik(ime.trim(), prezime.trim(), email.trim(), finalUloga, lozinka.trim());
        Korisnik saved = korisnikRepository.save(newUser);

        return ResponseEntity.ok(saved);
    }

    // --- GET DATA ---

    @GetMapping("/users")
    public List<Korisnik> getUsers() {
        return korisnikRepository.findAll();
    }

    @GetMapping("/assets")
    public List<Asset> getAssets() {
        return assetRepository.findAll();
    }

    @GetMapping("/incidents")
    public List<Incident> getIncidents() {
        return incidentRepository.findAllByOrderByDatumKreiranjeDesc();
    }

    @GetMapping("/resolutions")
    public List<Resolution> getResolutions() {
        return resolutionRepository.findAll();
    }

    @GetMapping("/incidents/{id}/resolution")
    public ResponseEntity<Resolution> getResolutionForIncident(@PathVariable String id) {
        return resolutionRepository.findByIncidentIncidentId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- DASHBOARD STATS ---

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long total = incidentRepository.count();
        long newInc = incidentRepository.countNewIncidents();
        long underInvestigation = incidentRepository.countUnderInvestigationIncidents();
        long closed = incidentRepository.countClosedIncidents();

        stats.put("total", total);
        stats.put("new", newInc);
        stats.put("underInvestigation", underInvestigation);
        stats.put("closed", closed);

        // Compute average resolution time in minutes
        List<Resolution> resolutions = resolutionRepository.findAll();
        double avgMinutes = 0;
        if (!resolutions.isEmpty()) {
            double totalMinutes = 0;
            for (Resolution res : resolutions) {
                Duration duration = Duration.between(res.getIncident().getDatumKreiranje(), res.getDatumZatvoranje());
                totalMinutes += duration.toMinutes();
            }
            avgMinutes = totalMinutes / resolutions.size();
        }
        stats.put("averageResolutionTimeMinutes", Math.round(avgMinutes * 10.0) / 10.0);

        // Group by incident type
        List<Incident> allIncidents = incidentRepository.findAll();
        Map<String, Integer> byType = new HashMap<>();
        for (Incident inc : allIncidents) {
            byType.put(inc.getTipIncident(), byType.getOrDefault(inc.getTipIncident(), 0) + 1);
        }
        stats.put("byType", byType);

        // Group by severity (itnost)
        Map<String, Integer> byItnost = new HashMap<>();
        for (Incident inc : allIncidents) {
            byItnost.put(inc.getItnost(), byItnost.getOrDefault(inc.getItnost(), 0) + 1);
        }
        stats.put("byItnost", byItnost);

        return stats;
    }

    // --- OPERATIONS ---

    // 1. Report Incident
    @PostMapping("/incidents")
    public ResponseEntity<?> reportIncident(@RequestBody Map<String, Object> payload) {
        String naslov = payload.get("naslov") != null ? payload.get("naslov").toString()
                : (payload.get("title") != null ? payload.get("title").toString() : null);
        String tip = payload.get("tipIncident") != null ? payload.get("tipIncident").toString()
                : (payload.get("type") != null ? payload.get("type").toString() : null);
        String opis = payload.get("opis") != null ? payload.get("opis").toString()
                : (payload.get("description") != null ? payload.get("description").toString() : null);
        String itnost = payload.get("itnost") != null ? payload.get("itnost").toString() : null;
        String email = payload.get("reporterEmail") != null ? payload.get("reporterEmail").toString() : null;

        Object assetIdObj = payload.get("assetId");
        Long assetId = null;
        if (assetIdObj != null) {
            try {
                assetId = Long.parseLong(assetIdObj.toString());
            } catch (NumberFormatException e) {
                log.error("Invalid assetId format: {}", assetIdObj);
            }
        }

        if (naslov == null || naslov.trim().isEmpty() ||
            tip == null || tip.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            assetId == null) {
            return ResponseEntity.badRequest().body("Некомплетни податоци. Ве молиме пополнете ги сите задолжителни полиња.");
        }

        // Find or create reporter
        Korisnik reporter = korisnikRepository.findByEmail(email)
                .orElseGet(() -> {
                    String name = email.split("@")[0];
                    Korisnik newUser = new Korisnik(name, "", email, "KORISNIK");
                    return korisnikRepository.save(newUser);
                });

        // Find asset
        Optional<Asset> assetOpt = assetRepository.findById(assetId);
        if (assetOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Избраното ИТ средство не е пронајдено.");
        }
        Asset asset = assetOpt.get();

        // Autocalculate Urgency/Itnost if Asset is CRITICAL
        String finalItnost = itnost;
        if ("KRITICNA".equalsIgnoreCase(asset.getKritichnost())) {
            finalItnost = "KRITICNA";
        }

        // Generate Incident ID (INC-YEAR-RANDOM)
        String uniqueId = "INC-" + Calendar.getInstance().get(Calendar.YEAR) + "-" + String.format("%04d", new Random().nextInt(10000));
        while (incidentRepository.existsById(uniqueId)) {
            uniqueId = "INC-" + Calendar.getInstance().get(Calendar.YEAR) + "-" + String.format("%04d", new Random().nextInt(10000));
        }

        Incident incident = new Incident();
        incident.setIncidentId(uniqueId);
        incident.setNaslov(naslov);
        incident.setTipIncident(tip);
        incident.setOpis(opis);
        incident.setStatus("NEW");
        incident.setItnost(finalItnost != null ? finalItnost.toUpperCase() : "SREDNA");
        incident.setDatumKreiranje(LocalDateTime.now());
        incident.setKorisnik(reporter);
        incident.setAsset(asset);

        Incident saved = incidentRepository.save(incident);

        // ---------------------------------------------------------------
        // Odoo интеграција: дополнително креирај helpdesk.ticket во Odoo.
        // Ако Odoo е недостапен, инцидентот сепак се зачувува во H2 — порталот
        // останува функционален. Грешката се логира и се враќа 200 со
        // дополнително поле odooTicketId (или null).
        // ---------------------------------------------------------------
        Integer odooTicketId = null;
        String odooError = null;
        if (odooClient != null) {
            try {
                int priority = KRITICHNOST_TO_PRIORITY.getOrDefault(
                        saved.getItnost(), 1);
                String title = saved.getIncidentId() + " - " + saved.getNaslov();
                String description = buildOdooDescription(saved, asset);

                // Испрати го инцидентот во Odoo како helpdesk.ticket.
                // Signature: createHelpdeskTicket(title, description,
                //                                assetId, teamId, priority)
                odooTicketId = odooClient.createHelpdeskTicket(
                        title,
                        description,
                        asset.getId() != null ? asset.getId().intValue() : null,
                        null,   // team_id: се доделува подоцна преку Odoo Studio automation
                        priority);
                log.info("Odoo ticket {} created for incident {}",
                        odooTicketId, saved.getIncidentId());
            } catch (Exception ex) {
                odooError = ex.getMessage();
                log.warn("Odoo create failed for incident {} (порталот продолжува): {}",
                        saved.getIncidentId(), ex.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("incident", saved);
        response.put("incidentId", saved.getIncidentId());
        response.put("odooTicketId", odooTicketId);
        response.put("odoo_ticket_id", odooTicketId);
        response.put("priority", KRITICHNOST_TO_PRIORITY.getOrDefault(saved.getItnost(), 1));
        response.put("odooError", odooError);
        return ResponseEntity.ok(response);
    }

    private String buildOdooDescription(Incident inc, Asset asset) {
        String reporter = (inc.getKorisnik() != null) ? inc.getKorisnik().getEmail() : "—";
        return String.format(
                "Incident ID: %s%nТип: %s%nИТ средство: %s (%s)%nКритичност: %s%n" +
                "Пријавил: %s%nДатум: %s%n%nОпис:%n%s",
                inc.getIncidentId(),
                inc.getTipIncident(),
                asset.getImeSredstvo(),
                asset.getIpAdresa(),
                asset.getKritichnost(),
                reporter,
                inc.getDatumKreiranje(),
                inc.getOpis() != null ? inc.getOpis() : "");
    }

    // 2. Claim Ticket
    @PostMapping("/incidents/{id}/claim")
    public ResponseEntity<?> claimIncident(@PathVariable String id, @RequestParam Long analystId) {
        Optional<Incident> incOpt = incidentRepository.findById(id);
        if (incOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Korisnik> userOpt = korisnikRepository.findById(analystId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Аналитичарот не е пронајден.");
        }

        Incident incident = incOpt.get();
        if (!"NEW".equals(incident.getStatus()) && !"UNDER_INVESTIGATION".equals(incident.getStatus())) {
            return ResponseEntity.badRequest().body("Овој инцидент не може да се преземе бидејќи е затворен.");
        }

        incident.setStatus("UNDER_INVESTIGATION");
        incident.setDodelenAnalitichar(userOpt.get());
        Incident saved = incidentRepository.save(incident);
        return ResponseEntity.ok(saved);
    }

    // 3. Resolve Incident
    @PostMapping("/incidents/{id}/resolve")
    public ResponseEntity<?> resolveIncident(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Optional<Incident> incOpt = incidentRepository.findById(id);
        if (incOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Incident incident = incOpt.get();
        if ("CLOSED".equals(incident.getStatus())) {
            return ResponseEntity.badRequest().body("Инцидентот е веќе затворен.");
        }

        String diagnosis = payload.get("dijagnoza");
        String steps = payload.get("prezemeniChekori");
        String recommendations = payload.get("preporaki");

        if (diagnosis == null || diagnosis.trim().isEmpty() ||
            steps == null || steps.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Мора да ги пополните дијагнозата и преземените чекори за санација.");
        }

        // Close incident
        incident.setStatus("CLOSED");
        incidentRepository.save(incident);

        // Save Resolution
        Resolution resolution = new Resolution();
        resolution.setIncident(incident);
        resolution.setDijagnoza(diagnosis.toUpperCase());
        resolution.setPrezemeniChekori(steps);
        resolution.setPreporaki(recommendations);
        resolution.setDatumZatvoranje(LocalDateTime.now());

        Resolution savedResolution = resolutionRepository.save(resolution);
        return ResponseEntity.ok(savedResolution);
    }
}
