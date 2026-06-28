package com.example.demo.service;

import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.EmailAttachmentDto;
import com.example.demo.dto.EmailMessageDto;
import com.example.demo.dto.MailBoxDto;
import com.example.demo.repository.EmailRecordRepository;
import com.example.demo.model.EmailRecord;
import org.springframework.mail.MailException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.util.*;

@Service
public class EmailService {

    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailRecordRepository emailRecordRepository;

    @Value("${spring.mail.username}")
    private String senderEmailAddress;

    @Value("${spring.mail.imap.host:${spring.mail.host}}")
    private String imapHost;

    @Value("${spring.mail.password}")
    public void setPassword(String rawPassword) {
        this.password = rawPassword != null ? rawPassword.replace(" ", "").trim() : "";
    }

    private String password;

    // Single listener taking the lightweight DTO
    @Transactional
    @RabbitListener(queues = "${rabbitmq.queue.name}")
    public void processQueuedEmail(EmailMessageDto messageDto) {
        userActivityLogger.info("Picked up email job for Record ID: {}", messageDto.getEmailRecordId());

        // 1. Fetch the full record from the DB
        Optional<EmailRecord> optionalRecord = emailRecordRepository.findById(messageDto.getEmailRecordId());
        if (optionalRecord.isEmpty()) {
            userActivityLogger.error("EmailRecord not found for ID: {}", messageDto.getEmailRecordId());
            return;
        }

        EmailRecord record = optionalRecord.get();

        // 2. Logic for delivery timing
        if (record.getScheduledSendTime() != null
                && record.getScheduledSendTime().isAfter(java.time.LocalDateTime.now())) {
            userActivityLogger.info(
                    "Email is scheduled for future delivery. (Note: Standard RabbitMQ requires a delayed-message plugin for this).");
            // You will need a way to handle delays here, otherwise it sends immediately.
            sendEmailImmediately(record);
        } else {
            sendEmailImmediately(record);
        }
    }

    private void sendEmailImmediately(EmailRecord record) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(record.getRecipients().toArray(new String[0]));
            helper.setFrom(senderEmailAddress);
            helper.setSubject(record.getSubject());
            EmailInlineImageProcessor.setHtmlBodyWithInlineImages(helper, record.getBody());

            // 3. Attach files using FileSystemResource and the saved paths
            if (record.getAttachmentPaths() != null) {
                for (String path : record.getAttachmentPaths()) {
                    File file = new File(path);
                    if (file.exists()) {
                        FileSystemResource resource = new FileSystemResource(file);
                        helper.addAttachment(file.getName(), resource);
                    } else {
                        userActivityLogger.warn("Attachment file not found on disk: {}", path);
                    }
                }
            }

            mailSender.send(message);

            // 4. Mark as sent in DB
            record.setSent(true);
            emailRecordRepository.save(record);
            userActivityLogger.info("Email sent successfully for Record ID: {}", record.getId());

        } catch (MailException e) {
            userActivityLogger.error("Failed to send email for Record ID: {} - {}", record.getId(), e.getMessage(), e);
        } catch (Exception e) {
            userActivityLogger.error("Failed to send email for Record ID: {} - {}", record.getId(), e.getMessage(), e);
        }
    }

    public List<MailBoxDto> readInbox(int limit) {
        List<MailBoxDto> emailList = new ArrayList<>();
        Folder inbox = null;
        Store store = null;
        Properties props = new Properties();
        props.put("mail.imap.host", imapHost);
        props.put("mail.imap.port", "993");
        props.put("mail.imap.ssl.enable", "true");
        props.put("mail.imap.ssl.trust", imapHost);
        props.put("mail.imap.auth.plain.disable", "false");
        props.put("mail.imap.auth.login.disable", "false");
        props.put("mail.imap.connectiontimeout", "15000");
        props.put("mail.imap.timeout", "30000");
        Session session = Session.getDefaultInstance(props, null);

        try {
            store = session.getStore("imaps");
            store.connect(imapHost, 993, senderEmailAddress, password);
            userActivityLogger.info("Connected to IMAP inbox at {}", imapHost);

            inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            int totalMessages = inbox.getMessageCount();
            if (totalMessages == 0) {
                return emailList;
            }

            int start = limit > 0
                    ? Math.max(1, totalMessages - limit + 1)
                    : 1;
            Message[] messages = inbox.getMessages(start, totalMessages);

            for (int i = messages.length - 1; i >= 0; i--) { // Read newest first
                Message msg = messages[i];
                MailBoxDto dto = new MailBoxDto();

                dto.setSubject(msg.getSubject());
                dto.setSender(extractAddresses(msg.getFrom()));
                dto.setTo(extractAddressList(msg.getRecipients(Message.RecipientType.TO)));
                dto.setCc(extractAddressList(msg.getRecipients(Message.RecipientType.CC)));
                dto.setBcc(extractAddressList(msg.getRecipients(Message.RecipientType.BCC)));

                parseMessageContent(msg, dto, true);
                emailList.add(dto);
            }
        } catch (AuthenticationFailedException e) {
            userActivityLogger.error("IMAP login failed for {} at {}: {}", senderEmailAddress, imapHost, e.getMessage());
            String hint = senderEmailAddress.contains("@gmail.com") || senderEmailAddress.contains("@googlemail.com")
                    ? "Use a Google App Password for this exact account (not your normal Gmail password), and enable IMAP under Gmail Settings → Forwarding and POP/IMAP."
                    : "When using smtp.gmail.com / imap.gmail.com, SPRING_MAIL_USERNAME must be a Google-hosted mailbox (@gmail.com or a Google Workspace address). The App Password must be created while signed into that same Google account.";
            throw new IllegalStateException("Could not sign in to the mailbox. " + hint);
        } catch (Exception e) {
            userActivityLogger.error("Failed to read emails: {}", e.getMessage(), e);
            String detail = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            if (detail.toLowerCase().contains("timeout") || detail.toLowerCase().contains("timed out")) {
                throw new IllegalStateException(
                        "Timed out connecting to IMAP. Check AWS outbound port 993 and try a smaller inbox limit.");
            }
            throw new IllegalStateException("Failed to read inbox: " + detail);
        } finally {
            try {
                if (inbox != null && inbox.isOpen())
                    inbox.close(false);
                if (store != null)
                    store.close();
            } catch (MessagingException e) {
                e.printStackTrace();
            }
        }
        return emailList;
    }

    private String extractAddresses(Address[] addresses) {
        if (addresses == null || addresses.length == 0)
            return "";
        return ((InternetAddress) addresses[0]).getAddress();
    }

    // Helper: Extract list of addresses
    private List<String> extractAddressList(Address[] addresses) {
        List<String> list = new ArrayList<>();
        if (addresses != null) {
            for (Address addr : addresses) {
                list.add(((InternetAddress) addr).getAddress());
            }
        }
        return list;
    }

    private void parseMessageContent(Part part, MailBoxDto dto) throws Exception {
        parseMessageContent(part, dto, false);
    }

    private void parseMessageContent(Part part, MailBoxDto dto, boolean skipAttachments) throws Exception {
        String contentType = part.getContentType().toLowerCase();
        String disposition = part.getDisposition();

        // 1. Handle Multipart Containers (Dig Deeper!)
        if (part.isMimeType("multipart/*")) {
            MimeMultipart multipart = (MimeMultipart) part.getContent();
            for (int i = 0; i < multipart.getCount(); i++) {
                parseMessageContent(multipart.getBodyPart(i), dto, skipAttachments);
            }
            return;
        }

        if (skipAttachments && (Part.ATTACHMENT.equalsIgnoreCase(disposition)
                || Part.INLINE.equalsIgnoreCase(disposition)
                || part.getFileName() != null)) {
            return;
        }

        // 2. Handle Attachments and Inline Images
        // We check this BEFORE text, because sometimes email clients send text files as attachments!
        if (Part.ATTACHMENT.equalsIgnoreCase(disposition) || 
            Part.INLINE.equalsIgnoreCase(disposition) || 
            part.getFileName() != null) {
            
            // Note: If an email client sets an inline image but no filename, we give it a default one.
            String fileName = part.getFileName() != null ? part.getFileName() : "inline-file-" + UUID.randomUUID();

            // Try-with-resources ensures the InputStream is always closed, preventing memory leaks
            try (InputStream is = part.getInputStream();
                 ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
                 
                int nRead;
                byte[] data = new byte[16384]; // 16KB chunk size is optimal
                while ((nRead = is.read(data, 0, data.length)) != -1) {
                    buffer.write(data, 0, nRead);
                }

                EmailAttachmentDto attachment = new EmailAttachmentDto(
                        fileName,
                        part.getContentType(),
                        buffer.toByteArray()
                );
                
                // IMPORTANT: Ensure your MailBoxDto initializes the attachments list: 
                // private List<EmailAttachmentDto> attachments = new ArrayList<>();
                dto.getAttachments().add(attachment);
            }
            return; // We handled the attachment, skip text processing
        }

        // 3. Handle the Email Body (HTML is king, Plain Text is the fallback)
        if (part.isMimeType("text/html")) {
            // If we find HTML, we always want to use it. It overwrites plain text.
            dto.setBody((String) part.getContent());
        } 
        else if (part.isMimeType("text/plain")) {
            // If we find Plain Text, ONLY set it if we haven't already found an HTML body.
            if (dto.getBody() == null) {
                dto.setBody((String) part.getContent());
            }
        }
    }
}