package com.campusforum.util;

import com.campusforum.dto.CommentDTO;
import com.campusforum.dto.PostDTO;
import com.campusforum.dto.ResourceDTO;
import com.campusforum.dto.UserDTO;
import com.campusforum.entity.Comment;
import com.campusforum.entity.Post;
import com.campusforum.entity.Resource;
import com.campusforum.entity.User;
import com.campusforum.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DtoMapper {
    private final UserService userService;

    public UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .realname(user.getRealname())
                .avatar(user.getAvatar())
                .bio(user.getBio())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public PostDTO toPostDTO(Post post) {
        Optional<User> user = userService.getUserById(post.getUserId());
        return PostDTO.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .username(user.map(User::getUsername).orElse("未知用户"))
                .avatar(user.map(User::getAvatar).orElse(null))
                .title(post.getTitle())
                .content(post.getContent())
                .category(post.getCategory())
                .viewCount(post.getViewCount())
                .replyCount(post.getReplyCount())
                .isPinned(post.getIsPinned())
                .isLocked(post.getIsLocked())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    public CommentDTO toCommentDTO(Comment comment) {
        Optional<User> user = userService.getUserById(comment.getUserId());
        return CommentDTO.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .username(user.map(User::getUsername).orElse("未知用户"))
                .avatar(user.map(User::getAvatar).orElse(null))
                .content(comment.getContent())
                .parentCommentId(comment.getParentCommentId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    public ResourceDTO toResourceDTO(Resource resource) {
        Optional<User> user = userService.getUserById(resource.getUserId());
        return ResourceDTO.builder()
                .id(resource.getId())
                .postId(resource.getPostId())
                .userId(resource.getUserId())
                .username(user.map(User::getUsername).orElse("未知用户"))
                .fileName(resource.getFileName())
                .storedFileName(resource.getStoredFileName())
                .fileSize(resource.getFileSize())
                .fileType(resource.getFileType())
                .downloadCount(resource.getDownloadCount())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
