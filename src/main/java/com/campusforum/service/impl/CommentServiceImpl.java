package com.campusforum.service.impl;

import com.campusforum.entity.Comment;
import com.campusforum.repository.CommentRepository;
import com.campusforum.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {
    private final CommentRepository commentRepository;

    @Override
    public Comment createComment(Long postId, Long userId, String content, Long parentCommentId) {
        Comment comment = Comment.builder()
                .postId(postId)
                .userId(userId)
                .content(content)
                .parentCommentId(parentCommentId)
                .build();
        return commentRepository.save(comment);
    }

    @Override
    public Optional<Comment> getCommentById(Long id) {
        return commentRepository.findById(id);
    }

    @Override
    public Page<Comment> getCommentsByPostId(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return commentRepository.findByPostId(postId, pageable);
    }

    @Override
    public Page<Comment> getRootCommentsByPostId(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return commentRepository.findByPostIdAndParentCommentIdIsNull(postId, pageable);
    }

    @Override
    public List<Comment> getRepliesByParentId(Long parentCommentId) {
        return commentRepository.findByParentCommentId(parentCommentId);
    }

    @Override
    public Page<Comment> getCommentsByUserId(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return commentRepository.findByUserId(userId, pageable);
    }

    @Override
    public Comment updateComment(Long id, String content) {
        Optional<Comment> existing = commentRepository.findById(id);
        if (existing.isPresent()) {
            Comment comment = existing.get();
            comment.setContent(content);
            return commentRepository.save(comment);
        }
        return null;
    }

    @Override
    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }

    @Override
    public long getCommentCountByPostId(Long postId) {
        return commentRepository.countByPostId(postId);
    }
}
