package com.campusforum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceDTO {
    private Long id;
    private Long postId;
    private Long userId;
    private String username;
    private String fileName;
    private String storedFileName;
    private Long fileSize;
    private String fileType;
    private Integer downloadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
