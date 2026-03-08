package com.campusforum.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDTO {
    private Long id;
    private Long postId;
    private Long userId;
    private String username;
    private String avatar;
    private String content;
    private Long parentCommentId;
    private List<CommentDTO> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
