package com.campusforum.repository;

import com.campusforum.entity.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    Page<Resource> findByPostId(Long postId, Pageable pageable);
    List<Resource> findByPostId(Long postId);
    Page<Resource> findByUserId(Long userId, Pageable pageable);
    Optional<Resource> findByStoredFileName(String storedFileName);
    long countByPostId(Long postId);
}
