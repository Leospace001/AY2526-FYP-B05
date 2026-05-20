import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void scheduleEmail(EmailRequestDto request, String currentUser) {

        // 2. Logic for delivery timing
        if (request.getSendTime() != null && request.getSendTime().isAfter(java.time.LocalDateTime.now())) {
            // Setup a delayed job using Spring TaskScheduler or Quartz
            // For simple, immediate background execution, we use @Async
        } else {
            sendEmailImmediately(request);
        }
    }


    @Async
    public void sendEmailImmediately(EmailRequestDto request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true); // true for multipart

            // Multiple recipients (must be a String Array)
            helper.setTo(request.getRecipients().toArray(new String[0]));
            helper.setSubject(request.getSubject());
            helper.setText(request.getBody(), true); // true for HTML

            // Multiple Attachments
            if (request.getAttachments() != null) {
                for (MultipartFile file : request.getAttachments()) {
                    if (!file.isEmpty()) {
                        helper.addAttachment(file.getOriginalFilename(), new ByteArrayResource(file.getBytes()));
                    }
                }
            }

            mailSender.send(message);
        } catch (Exception e) {
            // Handle email exception (log to DB, retry, etc.)
        }
    }
}
