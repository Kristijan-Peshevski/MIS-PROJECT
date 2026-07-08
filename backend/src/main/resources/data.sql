-- Seed Users (Korisnici)
INSERT INTO korisnici (ime, prezime, email, uloga) VALUES ('Кристијан', 'Пешевски', 'kristijan.peshevski@finki.ukim.mk', 'ANALITICAR');
INSERT INTO korisnici (ime, prezime, email, uloga) VALUES ('Филип', 'Михајлов', 'filip.mihajlov@finki.ukim.mk', 'ANALITICAR');
INSERT INTO korisnici (ime, prezime, email, uloga) VALUES ('Професор', 'МИС', 'profesor.mis@finki.ukim.mk', 'MENADZER');
INSERT INTO korisnici (ime, prezime, email, uloga) VALUES ('Јован', 'Јовановски', 'jovan.jovanovski@company.com', 'KORISNIK');
INSERT INTO korisnici (ime, prezime, email, uloga) VALUES ('Марија', 'Андонова', 'marija.andonova@company.com', 'KORISNIK');

-- Seed Assets
INSERT INTO assets (ime_sredstvo, ip_adresa, kritichnost) VALUES ('Главна База на Податоци (Core DB)', '10.0.1.5', 'KRITICNA');
INSERT INTO assets (ime_sredstvo, ip_adresa, kritichnost) VALUES ('Јавен Веб Сервер (Web Server)', '192.168.1.10', 'VISOKA');
INSERT INTO assets (ime_sredstvo, ip_adresa, kritichnost) VALUES ('Лаптоп на Директорот (CEO Laptop)', '10.0.5.12', 'VISOKA');
INSERT INTO assets (ime_sredstvo, ip_adresa, kritichnost) VALUES ('Локален Сервер за Датотеки (File Server)', '10.0.2.20', 'SREDNA');
INSERT INTO assets (ime_sredstvo, ip_adresa, kritichnost) VALUES ('Компјутер во Рецепција (Reception PC)', '192.168.2.105', 'NISKA');
