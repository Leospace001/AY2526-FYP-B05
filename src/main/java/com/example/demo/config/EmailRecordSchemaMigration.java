package com.example.demo.config;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class EmailRecordSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailRecordSchemaMigration.class);

    private record LegacyTable(String table, String foreignKey, String valueColumn) {}

    private static final LegacyTable[] RECIPIENT_SOURCES = {
            new LegacyTable("email_records_recipients", "email_records_id", "recipients"),
            new LegacyTable("email_record_recipients", "email_record_id", "recipients"),
            new LegacyTable("email_records_recipients", "email_record_id", "recipients"),
            new LegacyTable("emailrecord_recipients", "emailrecord_id", "recipients"),
    };

    private static final LegacyTable[] ATTACHMENT_SOURCES = {
            new LegacyTable("email_records_attachment_paths", "email_records_id", "attachment_paths"),
            new LegacyTable("email_record_attachment_paths", "email_record_id", "attachment_paths"),
            new LegacyTable("email_records_attachmentpaths", "email_records_id", "attachmentpaths"),
            new LegacyTable("emailrecord_attachment_paths", "emailrecord_id", "attachment_paths"),
    };

    private static final String[] LEGACY_TABLE_SUFFIXES = {
            "_recipients",
            "_attachment_paths",
            "_attachmentpaths",
    };

    private final JdbcTemplate jdbcTemplate;

    public EmailRecordSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("email_records")) {
            return;
        }

        ensureJsonbColumn("recipients");
        ensureJsonbColumn("attachment_paths");
        ensureBodyTextColumn();

        for (LegacyTable source : RECIPIENT_SOURCES) {
            migrateCollectionTable(source, "recipients");
        }
        for (LegacyTable source : ATTACHMENT_SOURCES) {
            migrateCollectionTable(source, "attachment_paths");
        }

        dropLegacyCollectionTables();
        log.info("EmailRecord schema uses jsonb columns on email_records (legacy collection tables removed if present).");
    }

    private void ensureBodyTextColumn() {
        if (!columnExists("email_records", "body")) {
            jdbcTemplate.execute("ALTER TABLE email_records ADD COLUMN body TEXT");
            log.info("Added email_records.body TEXT column");
            return;
        }

        String udtName = jdbcTemplate.queryForObject(
                """
                        SELECT udt_name
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'email_records'
                          AND column_name = 'body'
                        """,
                String.class);
        if ("oid".equalsIgnoreCase(udtName)) {
            jdbcTemplate.execute(
                    """
                            ALTER TABLE email_records
                            ALTER COLUMN body TYPE text
                            USING convert_from(lo_get(body), 'UTF8')
                            """);
            log.info("Converted email_records.body from PostgreSQL oid to text");
            return;
        }
        if (!"text".equalsIgnoreCase(udtName)) {
            jdbcTemplate.execute("ALTER TABLE email_records ALTER COLUMN body TYPE text USING body::text");
            log.info("Converted email_records.body from {} to text", udtName);
        }
    }

    private void ensureJsonbColumn(String columnName) {
        if (!columnExists("email_records", columnName)) {
            jdbcTemplate.execute(
                    "ALTER TABLE email_records ADD COLUMN " + columnName + " jsonb NOT NULL DEFAULT '[]'::jsonb");
            log.info("Added email_records.{} jsonb column", columnName);
            return;
        }

        String dataType = jdbcTemplate.queryForObject(
                """
                        SELECT data_type
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'email_records'
                          AND column_name = ?
                        """,
                String.class,
                columnName);
        if ("jsonb".equalsIgnoreCase(dataType)) {
            jdbcTemplate.execute(
                    "ALTER TABLE email_records ALTER COLUMN " + columnName + " SET DEFAULT '[]'::jsonb");
            jdbcTemplate.execute(
                    "UPDATE email_records SET " + columnName + " = '[]'::jsonb WHERE " + columnName + " IS NULL");
            return;
        }

        jdbcTemplate.execute(
                "ALTER TABLE email_records ALTER COLUMN " + columnName + " DROP DEFAULT");
        jdbcTemplate.execute(
                """
                        ALTER TABLE email_records
                        ALTER COLUMN %s TYPE jsonb
                        USING CASE
                            WHEN %s IS NULL OR btrim(%s::text) = '' THEN '[]'::jsonb
                            WHEN left(btrim(%s::text), 1) = '[' THEN btrim(%s::text)::jsonb
                            ELSE jsonb_build_array(btrim(%s::text))
                        END
                        """
                        .formatted(columnName, columnName, columnName, columnName, columnName, columnName));
        jdbcTemplate.execute(
                "ALTER TABLE email_records ALTER COLUMN " + columnName + " SET DEFAULT '[]'::jsonb");
        jdbcTemplate.execute(
                "UPDATE email_records SET " + columnName + " = '[]'::jsonb WHERE " + columnName + " IS NULL");
        log.info("Converted email_records.{} from {} to jsonb", columnName, dataType);
    }

    private void migrateCollectionTable(LegacyTable source, String targetColumn) {
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
            log.warn("Could not migrate {} into email_records.{}: {}",
                    source.table(), targetColumn, ex.getMessage());
        }
    }

    private void dropLegacyCollectionTables() {
        List<String> tables = jdbcTemplate.queryForList(
                """
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name <> 'email_records'
                          AND table_name LIKE '%email%'
                        """,
                String.class);
        for (String table : tables) {
            if (isLegacyCollectionTable(table)) {
                jdbcTemplate.execute("DROP TABLE IF EXISTS \"" + table + "\" CASCADE");
                log.info("Dropped legacy email collection table {}", table);
            }
        }
    }

    private boolean isLegacyCollectionTable(String tableName) {
        for (String suffix : LEGACY_TABLE_SUFFIXES) {
            if (tableName.endsWith(suffix)) {
                return true;
            }
        }
        return false;
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
