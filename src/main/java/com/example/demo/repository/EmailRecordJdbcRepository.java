package com.example.demo.repository;

import com.example.demo.config.AppTimeZone;
import com.example.demo.dto.EmailRecordSummaryDto;
import com.example.demo.dto.EmailSendDetails;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class EmailRecordJdbcRepository {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> LIST_TYPE = new TypeReference<>() {};

    private static final String SUMMARY_COLUMNS = """
            SELECT id,
                   COALESCE(recipients::text, '[]') AS recipients_json,
                   subject,
                   body,
                   COALESCE(attachment_paths::text, '[]') AS attachment_paths_json,
                   scheduled_send_time,
                   created_at,
                   updated_at,
                   sent,
                   dispatched
            FROM email_records
            """;

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<EmailRecordSummaryDto> summaryRowMapper = this::mapSummary;

    public EmailRecordJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insertEmail(
            Long userId,
            List<String> recipients,
            String subject,
            String body,
            List<String> attachmentPaths,
            LocalDateTime scheduledSendTime) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                            INSERT INTO email_records
                              (recipients, subject, body, attachment_paths, created_by, scheduled_send_time, sent, dispatched)
                            VALUES (?::jsonb, ?, ?, ?::jsonb, ?, ?, false, false)
                            """,
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, toJson(recipients));
            ps.setString(2, subject);
            ps.setString(3, body);
            ps.setString(4, toJson(attachmentPaths != null ? attachmentPaths : List.of()));
            ps.setLong(5, userId);
            if (scheduledSendTime != null) {
                ps.setTimestamp(6, Timestamp.valueOf(scheduledSendTime));
            } else {
                ps.setNull(6, Types.TIMESTAMP);
            }
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Could not save email record.");
        }
        return key.longValue();
    }

    public List<EmailRecordSummaryDto> findSentByUser(Long userId) {
        return jdbcTemplate.query(
                SUMMARY_COLUMNS + " WHERE created_by = ? AND sent = true ORDER BY updated_at DESC",
                summaryRowMapper,
                userId);
    }

    public List<EmailRecordSummaryDto> findScheduledByUser(Long userId, LocalDateTime now) {
        return jdbcTemplate.query(
                SUMMARY_COLUMNS
                        + """
                         WHERE created_by = ?
                           AND sent = false
                           AND scheduled_send_time IS NOT NULL
                           AND scheduled_send_time > ?
                         ORDER BY scheduled_send_time ASC
                        """,
                summaryRowMapper,
                userId,
                Timestamp.valueOf(now));
    }

    public List<EmailRecordSummaryDto> findOutboxByUser(Long userId) {
        return jdbcTemplate.query(
                SUMMARY_COLUMNS + " WHERE created_by = ? ORDER BY created_at DESC",
                summaryRowMapper,
                userId);
    }

    public Optional<EmailRecordSummaryDto> findSummaryByIdAndUser(Long id, Long userId) {
        List<EmailRecordSummaryDto> rows = jdbcTemplate.query(
                SUMMARY_COLUMNS + " WHERE id = ? AND created_by = ?",
                summaryRowMapper,
                id,
                userId);
        return rows.stream().findFirst();
    }

    public boolean existsForUser(Long id, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM email_records WHERE id = ? AND created_by = ?",
                Integer.class,
                id,
                userId);
        return count != null && count > 0;
    }

    public Optional<EmailSendDetails> findSendDetails(Long id) {
        List<EmailSendDetails> rows = jdbcTemplate.query(
                """
                        SELECT id,
                               COALESCE(recipients::text, '[]') AS recipients_json,
                               subject,
                               body,
                               COALESCE(attachment_paths::text, '[]') AS attachment_paths_json,
                               scheduled_send_time,
                               sent
                        FROM email_records
                        WHERE id = ?
                        """,
                (rs, rowNum) -> new EmailSendDetails(
                        rs.getLong("id"),
                        parseRecipients(rs.getString("recipients_json")),
                        rs.getString("subject"),
                        rs.getString("body"),
                        parseRecipients(rs.getString("attachment_paths_json")),
                        toLocalDateTime(rs.getTimestamp("scheduled_send_time")),
                        rs.getBoolean("sent")),
                id);
        return rows.stream().findFirst();
    }

    public void markSent(Long id) {
        jdbcTemplate.update("UPDATE email_records SET sent = true WHERE id = ?", id);
    }

    public void resetDispatched(Long id) {
        jdbcTemplate.update("UPDATE email_records SET dispatched = false WHERE id = ?", id);
    }

    public void deleteForUser(Long id, Long userId) {
        int deleted = jdbcTemplate.update(
                "DELETE FROM email_records WHERE id = ? AND created_by = ?",
                id,
                userId);
        if (deleted == 0) {
            throw new IllegalArgumentException("Email not found.");
        }
    }

    public List<Long> findDueRecordIds(LocalDateTime now) {
        return jdbcTemplate.queryForList(
                """
                        SELECT id
                        FROM email_records
                        WHERE sent = false
                          AND dispatched = false
                          AND scheduled_send_time IS NOT NULL
                          AND scheduled_send_time <= ?
                        """,
                Long.class,
                Timestamp.valueOf(now));
    }

    public void updateScheduledEmail(
            Long id,
            Long userId,
            List<String> recipients,
            String subject,
            String body,
            LocalDateTime sendTime) {
        int updated = jdbcTemplate.update(
                """
                        UPDATE email_records
                        SET recipients = ?::jsonb,
                            subject = ?,
                            body = ?,
                            scheduled_send_time = ?
                        WHERE id = ? AND created_by = ?
                        """,
                toJson(recipients),
                subject,
                body,
                Timestamp.valueOf(sendTime),
                id,
                userId);
        if (updated == 0) {
            throw new IllegalArgumentException("Email not found.");
        }
    }

    public void markDispatched(Long id) {
        jdbcTemplate.update(
                "UPDATE email_records SET dispatched = true WHERE id = ? AND dispatched = false",
                id);
    }

    private static String toJson(List<String> values) {
        try {
            return MAPPER.writeValueAsString(values != null ? values : List.of());
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize recipients to JSON", ex);
        }
    }

    private EmailRecordSummaryDto mapSummary(ResultSet rs, int rowNum) throws SQLException {
        LocalDateTime scheduledSendTime = toLocalDateTime(rs.getTimestamp("scheduled_send_time"));
        boolean sent = rs.getBoolean("sent");
        boolean dispatched = rs.getBoolean("dispatched");
        return new EmailRecordSummaryDto(
                rs.getLong("id"),
                parseRecipients(rs.getString("recipients_json")),
                rs.getString("subject"),
                rs.getString("body"),
                scheduledSendTime,
                toLocalDateTime(rs.getTimestamp("created_at")),
                toLocalDateTime(rs.getTimestamp("updated_at")),
                sent,
                dispatched,
                isEditable(scheduledSendTime, sent, dispatched),
                parseRecipients(rs.getString("attachment_paths_json")),
                AppTimeZone.ID);
    }

    private static boolean isEditable(LocalDateTime scheduledSendTime, boolean sent, boolean dispatched) {
        return !sent
                && !dispatched
                && scheduledSendTime != null
                && scheduledSendTime.isAfter(AppTimeZone.now());
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }

    private static List<String> parseRecipients(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return new ArrayList<>(MAPPER.readValue(json, LIST_TYPE));
        } catch (Exception ex) {
            return List.of();
        }
    }
}
