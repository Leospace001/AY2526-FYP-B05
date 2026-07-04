package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class EmailRecordCollectionMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailRecordCollectionMigration.class);

    private record LegacyTable(String table, String foreignKey, String valueColumn) {}

    private static final LegacyTable[] RECIPIENT_SOURCES = {
            new LegacyTable("email_records_recipients", "email_records_id", "recipients"),
            new LegacyTable("email_record_recipients", "email_record_id", "recipients"),
            new LegacyTable("email_records_recipients", "email_record_id", "recipients"),
    };

    private static final LegacyTable[] ATTACHMENT_SOURCES = {
            new LegacyTable("email_records_attachment_paths", "email_records_id", "attachment_paths"),
            new LegacyTable("email_record_attachment_paths", "email_record_id", "attachment_paths"),
            new LegacyTable("email_records_attachmentpaths", "email_records_id", "attachmentpaths"),
    };

    private final JdbcTemplate jdbcTemplate;

    public EmailRecordCollectionMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("email_records") || !columnExists("email_records", "recipients")) {
            return;
        }
        for (LegacyTable source : RECIPIENT_SOURCES) {
            migrate(source, "recipients");
        }
        for (LegacyTable source : ATTACHMENT_SOURCES) {
            migrate(source, "attachment_paths");
        }
    }

    private void migrate(LegacyTable source, String targetColumn) {
        if (!tableExists(source.table()) || !columnExists(source.table(), source.foreignKey())
                || !columnExists(source.table(), source.valueColumn())) {
            return;
        }
        try {
            String sql = """
                    UPDATE email_records er
                    SET %s = src.payload
                    FROM (
                        SELECT %s AS record_id,
                               jsonb_agg(%s ORDER BY %s) AS payload
                        FROM %s
                        GROUP BY %s
                    ) src
                    WHERE er.id = src.record_id
                      AND (
                        er.%s IS NULL
                        OR er.%s = 'null'::jsonb
                        OR jsonb_array_length(er.%s) = 0
                      )
                    """.formatted(
                    targetColumn,
                    source.foreignKey(),
                    source.valueColumn(),
                    source.valueColumn(),
                    source.table(),
                    source.foreignKey(),
                    targetColumn,
                    targetColumn,
                    targetColumn);
            int updated = jdbcTemplate.update(sql);
            if (updated > 0) {
                log.info("Migrated {} email record(s) into email_records.{} from {}",
                        updated, targetColumn, source.table());
            }
        } catch (Exception ex) {
            log.debug("Skipping migration from {} to {}: {}", source.table(), targetColumn, ex.getMessage());
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
