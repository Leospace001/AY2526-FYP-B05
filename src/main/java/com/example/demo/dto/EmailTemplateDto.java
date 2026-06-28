package com.example.demo.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmailTemplateDto {
    private String templateKey;
    private String displayName;
    private String subject;
    private String htmlContent;
    private List<String> availableVariables;
}
