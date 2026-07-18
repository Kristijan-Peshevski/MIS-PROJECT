package com.soc.portal.odoo;

import org.apache.xmlrpc.XmlRpcException;
import org.apache.xmlrpc.client.XmlRpcClient;
import org.apache.xmlrpc.client.XmlRpcClientConfigImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Odoo XML-RPC клиент за двонасочна комуникација со Odoo Helpdesk модулот.
 *
 * <p>Сервисот користи два XML-RPC ендпоинти на Odoo:
 * <ul>
 *   <li>{@code /xmlrpc/2/common} — {@code authenticate()} враќа UID.</li>
 *   <li>{@code /xmlrpc/2/object} — {@code execute_kw()} за CRUD на модели.</li>
 * </ul>
 *
 * <p>Конфигурацијата се вчитува од application.properties преку променливите:
 * <pre>
 *   odoo.url=http://odoo:8069/xmlrpc/2
 *   odoo.db=odoo
 *   odoo.user=admin
 *   odoo.password=admin
 * </pre>
 */
@Service
public class OdooClient {

    private static final Logger log = LoggerFactory.getLogger(OdooClient.class);

    @Value("${odoo.url}")
    private String odooUrl;

    @Value("${odoo.db}")
    private String odooDb;

    @Value("${odoo.user}")
    private String odooUser;

    @Value("${odoo.password}")
    private String odooPassword;

    private Integer uid;

    private XmlRpcClient buildClient(String path) throws MalformedURLException {
        XmlRpcClientConfigImpl cfg = new XmlRpcClientConfigImpl();
        cfg.setServerURL(new URL(odooUrl + path));
        cfg.setConnectionTimeout(5000);
        cfg.setReplyTimeout(10000);
        XmlRpcClient client = new XmlRpcClient();
        client.setConfig(cfg);
        return client;
    }

    /** Автентикација. UID се кешира за следните повици. */
    @SuppressWarnings("unchecked")
    public synchronized Integer authenticate() throws XmlRpcException, MalformedURLException {
        if (uid != null) {
            return uid;
        }
        XmlRpcClient client = buildClient("/common");
        Object result = client.execute("authenticate",
                Arrays.asList(odooDb, odooUser, odooPassword, Collections.emptyMap()));
        uid = (Integer) result;
        log.info("Odoo authenticated. uid={} db={}", uid, odooDb);
        return uid;
    }

    /**
     * Универзален wrapper за execute_kw на моделот.
     *
     * @param model име на модел (пр. "helpdesk.ticket")
     * @param method метод на моделот ("create", "write", "read", ...)
     * @param args аргументи на методот
     */
    public Object execute(String model, String method, List<?> args)
            throws XmlRpcException, MalformedURLException {
        Integer userId = authenticate();
        XmlRpcClient client = buildClient("/object");
        return client.execute("execute_kw", Arrays.asList(
                odooDb, userId, odooPassword, model, method, args));
    }

    /**
     * Креира нов project.task во Odoo и враќа Integer ID.
     *
     * @param title      Наслов на задачата
     * @param description Опис (HTML или чист текст)
     * @param assetId    ID на maintenance.equipment (x_soc_asset) - не се користи во project.task
     * @param teamId     ID на project.project - задачата се прикачува на овој проект
     * @param priority   0..1 за project.task (0=Low, 1=High). Нормално го пресликуваме од
     *                   нашиот helpdesk-стил 0..3: 0-1 -> 0, 2-3 -> 1.
     * @return Integer ID на новокреираната задача
     */
    public Integer createHelpdeskTicket(String title,
                                        String description,
                                        Integer assetId,
                                        Integer teamId,
                                        Integer priority)
            throws XmlRpcException, MalformedURLException {
        Map<String, Object> vals = new HashMap<>();
        vals.put("name", title);
        vals.put("description", description);
        if (teamId != null) {
            vals.put("project_id", teamId);
        }
        // project.task priority: 0=Low, 1=High. Нема Medium/Very High.
        if (priority != null) {
            int odooPriority = (priority >= 2) ? 1 : 0;
            vals.put("priority", String.valueOf(odooPriority));
        }
        // Класифицирај според критичноста на ИТ средството (x_kritichnost).
        // Ова е Odoo Tag - мора прво да постои или да се игнорира.
        // Пуштаме како x_studio_kritichnost преку Studio (слободно текст поле).
        Object id = execute("project.task", "create",
                Collections.singletonList(vals));
        Integer ticketId = (Integer) id;
        log.info("Created Odoo project.task id={} title={}", ticketId, title);
        return ticketId;
    }

    /** Читање на помошен запис (пр. maintenance.equipment по ID). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> read(String model, Integer id, List<String> fields)
            throws XmlRpcException, MalformedURLException {
        Object result = execute(model, "read",
                Arrays.asList(Collections.singletonList(id), fields));
        List<Object> list = (List<Object>) result;
        if (list.isEmpty()) {
            return Collections.emptyMap();
        }
        return (Map<String, Object>) list.get(0);
    }

    /** Повик за листање на сите записи во даден модел. */
    @SuppressWarnings("unchecked")
    public List<Object> searchRead(String model, List<?> domain,
                                   List<String> fields, Integer limit)
            throws XmlRpcException, MalformedURLException {
        Map<String, Object> kwargs = new HashMap<>();
        kwargs.put("fields", fields);
        if (limit != null) {
            kwargs.put("limit", limit);
        }
        Object result = execute(model, "search_read",
                Arrays.asList(domain, kwargs));
        return (List<Object>) result;
    }

    public String getOdooUrl() {
        return odooUrl;
    }

    public String getOdooDb() {
        return odooDb;
    }
}
