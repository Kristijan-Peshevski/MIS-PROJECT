package com.soc.portal.controller;

import com.soc.portal.model.*;
import com.soc.portal.repository.*;
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

    @Autowired
    private KorisnikRepository korisnikRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private ResolutionRepository resolutionRepository;

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
    public ResponseEntity<?> reportIncident(@RequestBody Map<String, String> payload) {
        String naslov = payload.get("naslov");
        String tip = payload.get("tipIncident");
        String opis = payload.get("opis");
        String itnost = payload.get("itnost");
        String email = payload.get("reporterEmail");
        Long assetId = Long.parseLong(payload.get("assetId"));

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
        return ResponseEntity.ok(saved);
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
