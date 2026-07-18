-- Seed Users (Korisnici) - use MERGE to avoid duplicate key errors on restart
MERGE INTO korisnici (id, ime, prezime, email, uloga) KEY(id) VALUES (1, 'Кристијан', 'Пешевски', 'kristijan.peshevski@finki.ukim.mk', 'ANALITICAR');
MERGE INTO korisnici (id, ime, prezime, email, uloga) KEY(id) VALUES (2, 'Филип', 'Михајлов', 'filip.mihajlov@finki.ukim.mk', 'ANALITICAR');
MERGE INTO korisnici (id, ime, prezime, email, uloga) KEY(id) VALUES (3, 'Професор', 'МИС', 'profesor.mis@finki.ukim.mk', 'MENADZER');
MERGE INTO korisnici (id, ime, prezime, email, uloga) KEY(id) VALUES (4, 'Јован', 'Јовановски', 'jovan.jovanovski@company.com', 'KORISNIK');
MERGE INTO korisnici (id, ime, prezime, email, uloga) KEY(id) VALUES (5, 'Марија', 'Андонова', 'marija.andonova@company.com', 'KORISNIK');

-- Seed Assets
MERGE INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) KEY(id) VALUES (1, 'Главна База на Податоци (Core DB)', '10.0.1.5', 'KRITICNA');
MERGE INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) KEY(id) VALUES (2, 'Јавен Веб Сервер (Web Server)', '192.168.1.10', 'VISOKA');
MERGE INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) KEY(id) VALUES (3, 'Лаптоп на Директорот (CEO Laptop)', '10.0.5.12', 'VISOKA');
MERGE INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) KEY(id) VALUES (4, 'Локален Сервер за Датотеки (File Server)', '10.0.2.20', 'SREDNA');
MERGE INTO assets (id, ime_sredstvo, ip_adresa, kritichnost) KEY(id) VALUES (5, 'Компјутер во Рецепција (Reception PC)', '192.168.2.105', 'NISKA');

-- Restart auto-increment sequences to prevent primary key violations when H2 tries to allocate ID 1
ALTER TABLE korisnici ALTER COLUMN id RESTART WITH 6;
ALTER TABLE assets ALTER COLUMN id RESTART WITH 6;
