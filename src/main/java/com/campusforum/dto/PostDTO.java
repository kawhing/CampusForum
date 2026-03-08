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
public class PostDTO {
    private Long id;
    private Long userId;
    private String username;
    private String avatar;
    private String title;
    private String content;
    private String category;
    private Integer viewCount;
    private Integer replyCount;
    private Boolean isPinned;
    private Boolean isLocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
