package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.model.AppSetting;
import com.example.demo.repository.AppSettingRepository;

@Service
public class AppSettingService {

    public static final String REGISTRATION_EMAIL_ENABLED = "registration_email_enabled";

    @Autowired
    private AppSettingRepository appSettingRepository;

    public boolean isRegistrationEmailEnabled() {
        return appSettingRepository.findBySettingKey(REGISTRATION_EMAIL_ENABLED)
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(false);
    }

    @Transactional
    public boolean setRegistrationEmailEnabled(boolean enabled) {
        AppSetting setting = appSettingRepository.findBySettingKey(REGISTRATION_EMAIL_ENABLED)
                .orElseGet(() -> {
                    AppSetting newSetting = new AppSetting();
                    newSetting.setSettingKey(REGISTRATION_EMAIL_ENABLED);
                    return newSetting;
                });
        setting.setSettingValue(Boolean.toString(enabled));
        appSettingRepository.save(setting);
        return enabled;
    }

    @Transactional
    public void ensureSetting(String key, String defaultValue) {
        if (appSettingRepository.findBySettingKey(key).isEmpty()) {
            AppSetting setting = new AppSetting();
            setting.setSettingKey(key);
            setting.setSettingValue(defaultValue);
            appSettingRepository.save(setting);
        }
    }
}
