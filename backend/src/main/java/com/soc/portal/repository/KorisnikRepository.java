package com.soc.portal.repository;

import com.soc.portal.model.Korisnik;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface KorisnikRepository extends JpaRepository<Korisnik, Long> {
    Optional<Korisnik> findByEmail(String email);
}
