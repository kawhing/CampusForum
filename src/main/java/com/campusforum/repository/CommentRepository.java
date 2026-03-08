package com.campusforum.repository;

import com.campusforum.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByPostId(Long postId, Pageable pageable);
    Page<Comment> findByPostIdAndParentCommentIdIsNull(Long postId, Pageable pageable);
    List<Comment> findByParentCommentId(Long parentCommentId);
    Page<Comment> findByUserId(Long userId, Pageable pageable);
    long countByPostId(Long postId);
}
