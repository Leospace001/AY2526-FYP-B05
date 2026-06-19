package com.example.demo.service;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.MimeMessageHelper;

import jakarta.mail.MessagingException;

/**
 * Email clients (Gmail, Outlook, etc.) block base64 data-URI images in HTML.
 * This converts {@code src="data:image/...;base64,..."} to CID inline parts.
 */
public final class EmailInlineImageProcessor {

    private static final Pattern INLINE_IMAGE_PATTERN = Pattern.compile(
            "src=(\"|\')(data:image/([a-zA-Z0-9+.-]+);base64,([^\"']+))\\1",
            Pattern.CASE_INSENSITIVE);

    private EmailInlineImageProcessor() {
    }

    private record InlineImage(byte[] data, String contentType) {
    }

    public static void setHtmlBodyWithInlineImages(MimeMessageHelper helper, String htmlBody)
            throws MessagingException {
        if (htmlBody == null || htmlBody.isBlank()) {
            helper.setText("", true);
            return;
        }

        if (!htmlBody.contains("data:image")) {
            helper.setText(htmlBody, true);
            return;
        }

        Matcher matcher = INLINE_IMAGE_PATTERN.matcher(htmlBody);
        StringBuffer updatedHtml = new StringBuffer();
        Map<String, InlineImage> inlineImages = new LinkedHashMap<>();
        int index = 0;

        while (matcher.find()) {
            String quote = matcher.group(1);
            String mimeSubType = matcher.group(3);
            String base64Payload = matcher.group(4).replaceAll("\\s+", "");
            String contentId = "inline-img-" + index++;

            try {
                byte[] imageBytes = Base64.getDecoder().decode(base64Payload);
                inlineImages.put(contentId, new InlineImage(imageBytes, "image/" + mimeSubType));
                matcher.appendReplacement(updatedHtml, "src=" + quote + "cid:" + contentId + quote);
            } catch (IllegalArgumentException ex) {
                matcher.appendReplacement(updatedHtml, Matcher.quoteReplacement(matcher.group(0)));
            }
        }
        matcher.appendTail(updatedHtml);

        helper.setText(updatedHtml.toString(), true);

        for (Map.Entry<String, InlineImage> entry : inlineImages.entrySet()) {
            InlineImage image = entry.getValue();
            helper.addInline(entry.getKey(), new ByteArrayResource(image.data()), image.contentType());
        }
    }
}
