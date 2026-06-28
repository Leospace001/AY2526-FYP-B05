package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import com.example.demo.dto.EmailRequestDto;
import com.example.demo.model.User;

@Service
public class RegistrationEmailService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationEmailService.class);

    @Autowired
    private AppSettingService appSettingService;

    @Autowired
    private EmailProducer emailProducer;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @Value("${DOMAIN}")
    private String domainUrl;

    public void sendWelcomeEmailIfEnabled(User user) {
        if (!appSettingService.isRegistrationEmailEnabled()) {
            return;
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        try {
            String displayName = user.getFirstname() != null && !user.getFirstname().isBlank()
                    ? user.getFirstname()
                    : user.getUsername();
            String loginUrl = domainUrl + "/login";

            Context context = new Context();
            context.setVariable("name", displayName);
            context.setVariable("username", user.getUsername());
            context.setVariable("domainUrl", domainUrl);
            context.setVariable("loginUrl", loginUrl);

            String htmlContent = templateEngine.process("email/welcomeRegistration", context);
            List<String> recipients = new ArrayList<>();
            recipients.add(user.getEmail());

            EmailRequestDto request = new EmailRequestDto(
                    recipients,
                    "Welcome to our platform",
                    htmlContent,
                    null,
                    null
            );
            emailProducer.sendEmailToQueue(request, user);
        } catch (Exception ex) {
            logger.error("Failed to queue registration welcome email for user {}", user.getUsername(), ex);
        }
    }
}
