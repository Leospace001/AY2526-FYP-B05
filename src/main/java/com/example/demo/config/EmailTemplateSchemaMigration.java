package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class EmailTemplateSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailTemplateSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public EmailTemplateSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("email_templates")) {
            return;
        }

        ensureHtmlContentTextColumn();
        log.info("EmailTemplate schema uses TEXT for html_content.");
    }

    private void ensureHtmlContentTextColumn() {
        if (!columnExists("email_templates", "html_content")) {
            jdbcTemplate.execute("ALTER TABLE email_templates ADD COLUMN html_content TEXT NOT NULL DEFAULT ''");
            log.info("Added email_templates.html_content TEXT column");
            return;
        }

        String udtName = jdbcTemplate.queryForObject(
                """
                        SELECT udt_name
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'email_templates'
                          AND column_name = 'html_content'
                        """,
                String.class);
        if ("oid".equalsIgnoreCase(udtName)) {
            jdbcTemplate.execute(
                    """
                            ALTER TABLE email_templates
                            ALTER COLUMN html_content TYPE text
                            USING convert_from(lo_get(html_content), 'UTF8')
                            """);
            log.info("Converted email_templates.html_content from PostgreSQL oid to text");
            return;
        }
        if (!"text".equalsIgnoreCase(udtName)) {
            jdbcTemplate.execute(
                    "ALTER TABLE email_templates ALTER COLUMN html_content TYPE text USING html_content::text");
            log.info("Converted email_templates.html_content from {} to text", udtName);
        }
    }

    private boolean tableExists(String table) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = ?
                        """,
                Integer.class,
                table);
        return count != null && count > 0;
    }

    private boolean columnExists(String table, String column) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = ?
                          AND column_name = ?
                        """,
                Integer.class,
                table,
                column);
        return count != null && count > 0;
    }
}
