package com.example.demo.config;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.TimeZone;

public final class AppTimeZone {

    public static final ZoneId HONG_KONG = ZoneId.of("Asia/Hong_Kong");
    public static final String ID = "Asia/Hong_Kong";
    public static final String LABEL = "Hong Kong Time (HKT, UTC+8)";

    private AppTimeZone() {
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(HONG_KONG);
    }

    public static void setJvmDefault() {
        TimeZone.setDefault(TimeZone.getTimeZone(HONG_KONG));
    }
}
