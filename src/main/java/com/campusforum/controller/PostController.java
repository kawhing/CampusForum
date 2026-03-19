package com.campusforum.controller;

import com.campusforum.dto.ApiResponse;
import com.campusforum.dto.PostDTO;
import com.campusforum.entity.Post;
import com.campusforum.service.PostService;
import com.campusforum.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;
    private final DtoMapper dtoMapper;

    @PostMapping
    public ApiResponse<?> createPost(
            @RequestParam Long userId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String category) {

        if (title.isBlank() || content.isBlank()) {
            return ApiResponse.error("标题和内容不能为空");
        }

        Post post = postService.createPost(userId, title, content, category);
        return ApiResponse.success("发布成功", dtoMapper.toPostDTO(post));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getPost(@PathVariable Long id) {
        Optional<Post> post = postService.getPostById(id);
        if (post.isPresent()) {
            postService.incrementViewCount(id);
            return ApiResponse.success(dtoMapper.toPostDTO(post.get()));
        }
        return ApiResponse.notFound();
    }

    @GetMapping
    public ApiResponse<?> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Post> posts = postService.getAllPosts(page, size);
        return ApiResponse.success(posts.map(dtoMapper::toPostDTO));
    }

    @GetMapping("/category/{category}")
    public ApiResponse<?> getPostsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Post> posts = postService.getPostsByCategory(category, page, size);
        return ApiResponse.success(posts.map(dtoMapper::toPostDTO));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<?> getPostsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Post> posts = postService.getPostsByUserId(userId, page, size);
        return ApiResponse.success(posts.map(dtoMapper::toPostDTO));
    }

    @GetMapping("/search")
    public ApiResponse<?> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Post> posts = postService.searchPosts(keyword, page, size);
        return ApiResponse.success(posts.map(dtoMapper::toPostDTO));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updatePost(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String category) {

        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setCategory(category);

        Post updated = postService.updatePost(id, post);
        if (updated != null) {
            return ApiResponse.success("更新成功", dtoMapper.toPostDTO(updated));
        }
        return ApiResponse.notFound();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ApiResponse.success("删除成功", null);
    }

    @PostMapping("/{id}/pin")
    public ApiResponse<?> pinPost(@PathVariable Long id, @RequestParam boolean pin) {
        postService.pinPost(id, pin);
        return ApiResponse.success(pin ? "置顶成功" : "取消置顶成功", null);
    }

    @PostMapping("/{id}/lock")
    public ApiResponse<?> lockPost(@PathVariable Long id, @RequestParam boolean lock) {
        postService.lockPost(id, lock);
        return ApiResponse.success(lock ? "锁定成功" : "解锁成功", null);
    }
}
