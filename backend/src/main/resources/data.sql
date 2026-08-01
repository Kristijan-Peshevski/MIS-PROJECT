-- Seed Users (Korisnici) with default password 'postgres'
INSERT INTO korisnici (id, ime, prezime, email, uloga, lozinka) VALUES (1, 'Кристијан', 'Пешевски', 'kristijan.peshevski@finki.ukim.mk', 'ANALITICAR', 'postgres') ON CONFLICT (id) DO NOTHING;
INSERT INTO korisnici (id, ime, prezime, email, uloga, lozinka) VALUES (2, 'Ѓорѓи', 'Сивевски', 'gorgi.siveski@finki.ukim.mk', 'ANALITICAR', 'postgres') ON CONFLICT (id) DO NOTHING;
INSERT INTO korisnici (id, ime, prezime, email, uloga, lozinka) VALUES (3, 'Професор', 'МИС', 'profesor.mis@finki.ukim.mk', 'MENADZER', 'postgres') ON CONFLICT (id) DO NOTHING;
INSERT INTO korisnici (id, ime, prezime, email, uloga, lozinka) VALUES (4, 'Јован', 'Јовановски', 'jovan.jovanovski@company.com', 'KORISNIK', 'postgres') ON CONFLICT (id) DO NOTHING;
INSERT INTO korisnici (id, ime, prezime, email, uloga, lozinka) VALUES (5, 'Марија', 'Андонова', 'marija.andonova@company.com', 'KORISNIK', 'postgres') ON CONFLICT (id) DO NOTHING;

-- Seed Assets
INSERT INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) VALUES (1, 'Главна База на Податоци (Core DB)', '10.0.1.5', 'KRITICNA') ON CONFLICT (id) DO NOTHING;
INSERT INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) VALUES (2, 'Јавен Веб Сервер (Web Server)', '192.168.1.10', 'VISOKA') ON CONFLICT (id) DO NOTHING;
INSERT INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) VALUES (3, 'Лаптоп на Директорот (CEO Laptop)', '10.0.5.12', 'VISOKA') ON CONFLICT (id) DO NOTHING;
INSERT INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) VALUES (4, 'Локален Сервер за Датотеки (File Server)', '10.0.2.20', 'SREDNA') ON CONFLICT (id) DO NOTHING;
INSERT INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) VALUES (5, 'Компјутер во Рецепција (Reception PC)', '192.168.2.105', 'NISKA') ON CONFLICT (id) DO NOTHING;

-- Sync auto-increment sequences for PostgreSQL
SELECT setval('korisnici_id_seq', (SELECT GREATEST(MAX(id), 5) FROM korisnici));
SELECT setval('assets_id_seq', (SELECT GREATEST(MAX(id), 5) FROM assets));
