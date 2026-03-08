package com.campusforum.service;

import com.campusforum.entity.Post;
import org.springframework.data.domain.Page;
import java.util.Optional;

public interface PostService {
    Post createPost(Long userId, String title, String content, String category);
    Optional<Post> getPostById(Long id);
    Page<Post> getAllPosts(int page, int size);
    Page<Post> getPostsByCategory(String category, int page, int size);
    Page<Post> getPostsByUserId(Long userId, int page, int size);
    Page<Post> searchPosts(String keyword, int page, int size);
    Post updatePost(Long id, Post post);
    void deletePost(Long id);
    void incrementViewCount(Long postId);
    void updateReplyCount(Long postId);
    void pinPost(Long postId, boolean pin);
    void lockPost(Long postId, boolean lock);
}
