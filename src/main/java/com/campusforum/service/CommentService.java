package com.campusforum.service;

import com.campusforum.entity.Comment;
import org.springframework.data.domain.Page;
import java.util.List;
import java.util.Optional;

public interface CommentService {
    Comment createComment(Long postId, Long userId, String content, Long parentCommentId);
    Optional<Comment> getCommentById(Long id);
    Page<Comment> getCommentsByPostId(Long postId, int page, int size);
    Page<Comment> getRootCommentsByPostId(Long postId, int page, int size);
    List<Comment> getRepliesByParentId(Long parentCommentId);
    Page<Comment> getCommentsByUserId(Long userId, int page, int size);
    Comment updateComment(Long id, String content);
    void deleteComment(Long id);
    long getCommentCountByPostId(Long postId);
}
