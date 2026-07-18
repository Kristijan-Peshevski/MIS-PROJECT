# Odoo Setup Guide — за SOC Portal проект

Овој документ ги опишува сите чекори потребни за инсталација и конфигурација на Odoo ERP серверот за потребите на проектот SOC Portal.

---

## 1. Стартување на Odoo преку Docker Compose

```bash
# Од root на проектот
docker compose up -d

# За да провериме дека сите 4 сервиси се подигнати
docker compose ps
```

Треба да ги видиме сите четири сервиси како `running`:

- `soc_odoo_db`  (PostgreSQL 15)
- `soc_odoo`     (Odoo 17.0)
- `soc_backend`  (Spring Boot 3.3)
- `soc_frontend` (React + Nginx)

---

## 2. Иницијален пристап до Odoo Helpdesk

1. Отвори `http://localhost:8069` во прелистувач.
2. Корисничко име: **admin**
3. Лозинка: **admin** (од `ADMIN_PASSWD` во docker-compose.yml)
4. Кликни **Manage Databases** и креирај база со име **odoo** (доколку не постои).
5. На првиот екран избери:
   - Company: SOC Portal Demo
   - Country: Macedonia
   - Language: Macedonian / English

---

## 3. Инсталација на Helpdesk модулот

1. Од главното мени оди на **Apps**.
2. Во пребарувачот пиши `Helpdesk`.
3. Инсталирај го модулот **Helpdesk / Ticket Management** (`helpdesk_mgmt`).
4. По инсталацијата, истиот ќе се појави во менито како **Helpdesk**.

---

## 4. Конфигурација преку Odoo Studio

### 4.1. Додавање на полиња на моделот `helpdesk.ticket`

1. Оди на **Settings → Technical → Database Structure → Models**.
2. Побарај `helpdesk.ticket` и кликни на него.
3. Кликни на **Enter Studio** (горен десен агол).
4. Додај ги следните полиња:

| Field Name | Label | Type |
|---|---|---|
| `x_soc_asset_id` | SOC Asset | Many2One (`maintenance.equipment`) |
| `x_soc_diagnosis` | Дијагноза | Selection: True Positive, False Positive, Pending |
| `x_soc_remediation` | Чекори за санација | Html |

### 4.2. Додавање на `x_criticality` на моделот `maintenance.equipment`

1. Истата постапка за моделот `maintenance.equipment`.
2. Додај поле `x_criticality`, тип Selection со вредности:
   - `KRITICNA` (Критична)
   - `VISOKA` (Висока)
   - `SREDNA` (Средна)
   - `NISKA` (Ниска)

### 4.3. Креирање на Kanban стадиуми

1. Оди на **Helpdesk → Configuration → Stages**.
2. Стадиумите треба да бидат:
   - **Нов** (New) — `fold=False`, sequence=1
   - **Под истрага** (Under Investigation) — `fold=False`, sequence=2
   - **Решен** (Solved) — `fold=True`, sequence=3

### 4.4. Automated Action за автоматско пресметување на приоритет

1. Оди на **Settings → Technical → Automation → Automated Actions**.
2. Креирај нова акција:
   - **Model:** `helpdesk.ticket`
   - **Trigger:** On Creation & Update
   - **Action To Do:** Execute Python Code
3. Во полето **Python Code** внеси:

```python
criticality_map = {
    'KRITICNA': 3,  # Very High
    'VISOKA': 2,    # High
    'SREDNA': 1,    # Medium
    'NISKA': 0,     # Low
}

if record.x_soc_asset_id and record.x_soc_asset_id.x_criticality:
    new_priority = criticality_map.get(record.x_soc_asset_id.x_criticality, 0)
    if record.priority != new_priority:
        record.write({'priority': new_priority})
        record.message_post(
            body=f"Автоматски поставен приоритет {new_priority} врз основа на критичноста на средството ({record.x_soc_asset_id.x_criticality})."
        )
```

4. Зачувај ја акцијата.

---

## 5. Креирање на Helpdesk Team

1. Оди на **Helpdesk → Configuration → Helpdesk Teams**.
2. Креирај нов team со име **SOC Team**.
3. Забележи го `id` (најчесто 1).

---

## 6. Конфигурација на Spring Boot

Провери дека `application.properties` ги содржи следните вредности (или се пренесуваат преку Docker Compose env vars):

```properties
odoo.url=http://odoo:8069/xmlrpc/2
odoo.db=odoo
odoo.user=admin
odoo.password=admin
```

---

## 7. Конфигурација на React

`vite.config.js` (dev):

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
});
```

`frontend/nginx.conf` (production):

```nginx
location /api/ {
    proxy_pass http://backend:8080/api/;
}
```

---

## 8. Тестирање на крај-до-крај текот

```bash
# 1. Стартувај го целиот стек
docker compose up --build -d

# 2. Отвори React портал
start http://localhost

# 3. Пополни го формуларот со инцидент
# 4. Провери дали тикетот се појави во Odoo Helpdesk
start http://localhost:8069/web#model=helpdesk.ticket
```

Ако сите 4 чекори поминаа успешно, целосната интеграција работи.
