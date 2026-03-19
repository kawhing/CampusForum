package com.campusforum.service.impl;

import com.campusforum.entity.Post;
import com.campusforum.repository.PostRepository;
import com.campusforum.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {
    private final PostRepository postRepository;

    @Override
    public Post createPost(Long userId, String title, String content, String category) {
        Post post = Post.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .category(category != null ? category : "DISCUSS")
                .viewCount(0)
                .replyCount(0)
                .isPinned(false)
                .isLocked(false)
                .build();
        return postRepository.save(post);
    }

    @Override
    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    @Override
    public Page<Post> getAllPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("isPinned").descending().and(Sort.by("createdAt").descending()));
        return postRepository.findAll(pageable);
    }

    @Override
    public Page<Post> getPostsByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("isPinned").descending().and(Sort.by("createdAt").descending()));
        return postRepository.findByCategory(category, pageable);
    }

    @Override
    public Page<Post> getPostsByUserId(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByUserId(userId, pageable);
    }

    @Override
    public Page<Post> searchPosts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByTitleContainingIgnoreCase(keyword, pageable);
    }

    @Override
    public Post updatePost(Long id, Post post) {
        Optional<Post> existing = postRepository.findById(id);
        if (existing.isPresent()) {
            Post existingPost = existing.get();
            if (post.getTitle() != null) {
                existingPost.setTitle(post.getTitle());
            }
            if (post.getContent() != null) {
                existingPost.setContent(post.getContent());
            }
            if (post.getCategory() != null) {
                existingPost.setCategory(post.getCategory());
            }
            return postRepository.save(existingPost);
        }
        return null;
    }

    @Override
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    @Override
    public void incrementViewCount(Long postId) {
        postRepository.findById(postId).ifPresent(p -> {
            p.setViewCount(p.getViewCount() + 1);
            postRepository.save(p);
        });
    }

    @Override
    public void updateReplyCount(Long postId) {
        postRepository.findById(postId).ifPresent(p -> {
            p.setReplyCount(p.getReplyCount() + 1);
            postRepository.save(p);
        });
    }

    @Override
    public void pinPost(Long postId, boolean pin) {
        postRepository.findById(postId).ifPresent(p -> {
            p.setIsPinned(pin);
            postRepository.save(p);
        });
    }

    @Override
    public void lockPost(Long postId, boolean lock) {
        postRepository.findById(postId).ifPresent(p -> {
            p.setIsLocked(lock);
            postRepository.save(p);
        });
    }
}
