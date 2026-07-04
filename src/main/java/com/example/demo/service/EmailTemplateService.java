package com.example.demo.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import com.example.demo.dto.EmailTemplateDto;
import com.example.demo.dto.UpdateEmailTemplateDto;
import com.example.demo.model.EmailTemplate;
import com.example.demo.repository.EmailTemplateRepository;
import jakarta.annotation.PostConstruct;

@Service
public class EmailTemplateService {

    private static final Map<String, TemplateDefaults> DEFAULTS = Map.of(
            EmailTemplate.FORGOT_PASSWORD, new TemplateDefaults(
                    "Forgot Password",
                    "Reset password Email",
                    "templates/email/forgotPassword.html",
                    List.of("name", "token", "domainUrl", "tokenUrl")),
            EmailTemplate.WELCOME_REGISTRATION, new TemplateDefaults(
                    "Welcome Registration",
                    "Welcome to our platform",
                    "templates/email/welcomeRegistration.html",
                    List.of("name", "username", "domainUrl", "loginUrl")));

    @Autowired
    private EmailTemplateRepository emailTemplateRepository;

    @Value("${DOMAIN:http://localhost}")
    private String domainUrl;

    private SpringTemplateEngine stringTemplateEngine;

    @PostConstruct
    void initStringTemplateEngine() {
        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);
        resolver.setCheckExistence(false);
        stringTemplateEngine = new SpringTemplateEngine();
        stringTemplateEngine.setTemplateResolver(resolver);
    }

    @Transactional
    public void seedDefaultsIfMissing() {
        DEFAULTS.forEach((key, defaults) -> {
            var existing = emailTemplateRepository.findByTemplateKey(key);
            if (existing.isEmpty()) {
                emailTemplateRepository.save(EmailTemplate.builder()
                        .templateKey(key)
                        .displayName(defaults.displayName())
                        .subject(defaults.subject())
                        .htmlContent(readClasspathTemplate(defaults.classpathLocation()))
                        .build());
                return;
            }

            EmailTemplate template = existing.get();
            if (looksLikeBrokenHtmlContent(template.getHtmlContent())) {
                template.setHtmlContent(readClasspathTemplate(defaults.classpathLocation()));
                emailTemplateRepository.save(template);
            }
        });
    }

    public List<EmailTemplateDto> listTemplates() {
        return emailTemplateRepository.findAll().stream()
                .sorted(Comparator.comparing(EmailTemplate::getTemplateKey))
                .map(this::toDto)
                .toList();
    }

    public EmailTemplateDto getTemplate(String templateKey) {
        return toDto(getRequiredTemplate(templateKey));
    }

    @Transactional
    public EmailTemplateDto updateTemplate(String templateKey, UpdateEmailTemplateDto update) {
        if (!DEFAULTS.containsKey(templateKey)) {
            throw new IllegalArgumentException("Unknown email template: " + templateKey);
        }
        if (update.getSubject() == null || update.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (update.getHtmlContent() == null || update.getHtmlContent().isBlank()) {
            throw new IllegalArgumentException("HTML content is required.");
        }

        EmailTemplate template = getRequiredTemplate(templateKey);
        template.setSubject(update.getSubject().trim());
        template.setHtmlContent(update.getHtmlContent());
        return toDto(emailTemplateRepository.save(template));
    }

    @Transactional
    public EmailTemplateDto resetTemplate(String templateKey) {
        TemplateDefaults defaults = DEFAULTS.get(templateKey);
        if (defaults == null) {
            throw new IllegalArgumentException("Unknown email template: " + templateKey);
        }

        EmailTemplate template = getRequiredTemplate(templateKey);
        template.setSubject(defaults.subject());
        template.setHtmlContent(readClasspathTemplate(defaults.classpathLocation()));
        return toDto(emailTemplateRepository.save(template));
    }

    public String renderTemplate(String templateKey, Context context) {
        EmailTemplate template = getRequiredTemplate(templateKey);
        return stringTemplateEngine.process(template.getHtmlContent(), context);
    }

    public String getSubject(String templateKey) {
        return getRequiredTemplate(templateKey).getSubject();
    }

    public String resolveDisplayName(String templateKey) {
        if (templateKey == null || templateKey.isBlank()) {
            return null;
        }
        return emailTemplateRepository.findByTemplateKey(templateKey)
                .map(EmailTemplate::getDisplayName)
                .orElse(templateKey);
    }

    public String previewHtml(String templateKey, String htmlContent) {
        if (!DEFAULTS.containsKey(templateKey)) {
            throw new IllegalArgumentException("Unknown email template: " + templateKey);
        }
        if (htmlContent == null || htmlContent.isBlank()) {
            throw new IllegalArgumentException("HTML content is required.");
        }
        try {
            return stringTemplateEngine.process(htmlContent, buildPreviewContext(templateKey));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Template preview failed: " + ex.getMessage());
        }
    }

    private Context buildPreviewContext(String templateKey) {
        Context context = new Context();
        String baseUrl = domainUrl.endsWith("/") ? domainUrl.substring(0, domainUrl.length() - 1) : domainUrl;

        if (EmailTemplate.FORGOT_PASSWORD.equals(templateKey)) {
            context.setVariable("name", "Demo User");
            context.setVariable("token", "sample-reset-token");
            context.setVariable("domainUrl", baseUrl);
            context.setVariable("tokenUrl", baseUrl + "/reset?token=sample-reset-token");
        } else if (EmailTemplate.WELCOME_REGISTRATION.equals(templateKey)) {
            context.setVariable("name", "Demo");
            context.setVariable("username", "demo_user");
            context.setVariable("domainUrl", baseUrl);
            context.setVariable("loginUrl", baseUrl + "/login");
        }
        return context;
    }

    private EmailTemplate getRequiredTemplate(String templateKey) {
        return emailTemplateRepository.findByTemplateKey(templateKey)
                .orElseThrow(() -> new IllegalArgumentException("Email template not found: " + templateKey));
    }

    private EmailTemplateDto toDto(EmailTemplate template) {
        TemplateDefaults defaults = DEFAULTS.get(template.getTemplateKey());
        return new EmailTemplateDto(
                template.getTemplateKey(),
                template.getDisplayName(),
                template.getSubject(),
                template.getHtmlContent(),
                defaults != null ? defaults.variables() : List.of());
    }

    private String readClasspathTemplate(String classpathLocation) {
        try {
            ClassPathResource resource = new ClassPathResource(classpathLocation);
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load default template: " + classpathLocation, ex);
        }
    }

    private static boolean looksLikeBrokenHtmlContent(String content) {
        if (content == null || content.isBlank()) {
            return true;
        }
        String trimmed = content.trim();
        return trimmed.matches("\\d+") || !trimmed.contains("<");
    }

    private record TemplateDefaults(
            String displayName,
            String subject,
            String classpathLocation,
            List<String> variables) {
    }
}
