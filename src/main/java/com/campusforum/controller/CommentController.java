package com.campusforum.controller;

import com.campusforum.dto.ApiResponse;
import com.campusforum.dto.CommentDTO;
import com.campusforum.entity.Comment;
import com.campusforum.entity.User;
import com.campusforum.service.CommentService;
import com.campusforum.service.PostService;
import com.campusforum.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;
    private final PostService postService;
    private final UserService userService;

    @PostMapping
    public ApiResponse<?> createComment(
            @RequestParam Long postId,
            @RequestParam Long userId,
            @RequestParam String content,
            @RequestParam(required = false) Long parentCommentId) {

        if (content.isBlank()) {
            return ApiResponse.error("评论内容不能为空");
        }

        Comment comment = commentService.createComment(postId, userId, content, parentCommentId);
        postService.updateReplyCount(postId);
        return ApiResponse.success("评论成功", convertToDTO(comment));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getComment(@PathVariable Long id) {
        Optional<Comment> comment = commentService.getCommentById(id);
        if (comment.isPresent()) {
            return ApiResponse.success(convertToDTO(comment.get()));
        }
        return ApiResponse.notFound();
    }

    @GetMapping("/post/{postId}")
    public ApiResponse<?> getCommentsByPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Comment> comments = commentService.getRootCommentsByPostId(postId, page, size);
        return ApiResponse.success(comments.map(comment -> {
            CommentDTO dto = convertToDTO(comment);
            List<Comment> replies = commentService.getRepliesByParentId(comment.getId());
            dto.setReplies(replies.stream().map(this::convertToDTO).collect(Collectors.toList()));
            return dto;
        }));
    }

    @GetMapping("/parent/{parentCommentId}")
    public ApiResponse<?> getCommentReplies(@PathVariable Long parentCommentId) {
        List<Comment> replies = commentService.getRepliesByParentId(parentCommentId);
        return ApiResponse.success(replies.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<?> getCommentsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Comment> comments = commentService.getCommentsByUserId(userId, page, size);
        return ApiResponse.success(comments.map(this::convertToDTO));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateComment(
            @PathVariable Long id,
            @RequestParam String content) {

        if (content.isBlank()) {
            return ApiResponse.error("评论内容不能为空");
        }

        Comment comment = commentService.updateComment(id, content);
        if (comment != null) {
            return ApiResponse.success("更新成功", convertToDTO(comment));
        }
        return ApiResponse.notFound();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ApiResponse.success("删除成功", null);
    }

    private CommentDTO convertToDTO(Comment comment) {
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
}
