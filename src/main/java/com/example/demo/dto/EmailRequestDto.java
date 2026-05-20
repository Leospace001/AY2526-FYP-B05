import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EmailRequestDto {
    private List<String> recipients;
    private String subject;
    private String body;
    private List<MultipartFile> attachments;
    private LocalDateTime sendTime; // For delayed delivery
}
