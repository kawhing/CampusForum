package com.campusforum.controller;

import com.campusforum.dto.ApiResponse;
import com.campusforum.dto.ResourceDTO;
import com.campusforum.entity.Resource;
import com.campusforum.entity.User;
import com.campusforum.service.ResourceService;
import com.campusforum.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService resourceService;
    private final UserService userService;

    @PostMapping("/upload")
    public ApiResponse<?> uploadFile(
            @RequestParam Long postId,
            @RequestParam Long userId,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ApiResponse.error("文件不能为空");
        }

        if (!resourceService.isFileSizeValid(file.getSize())) {
            return ApiResponse.error("文件大小不能超过 20MB");
        }

        try {
            Resource resource = resourceService.uploadFile(postId, userId, file);
            return ApiResponse.success("上传成功", convertToDTO(resource));
        } catch (IOException e) {
            return ApiResponse.error("上传失败：" + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getResource(@PathVariable Long id) {
        Optional<Resource> resource = resourceService.getResourceById(id);
        if (resource.isPresent()) {
            return ApiResponse.success(convertToDTO(resource.get()));
        }
        return ApiResponse.notFound();
    }

    @GetMapping("/post/{postId}")
    public ApiResponse<?> getResourcesByPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Resource> resources = resourceService.getResourcesByPostId(postId, page, size);
        return ApiResponse.success(resources.map(this::convertToDTO));
    }

    @GetMapping("/post-list/{postId}")
    public ApiResponse<?> getResourcesByPostList(@PathVariable Long postId) {
        List<Resource> resources = resourceService.getResourcesByPostIdList(postId);
        return ApiResponse.success(resources.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<?> getResourcesByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Resource> resources = resourceService.getResourcesByUserId(userId, page, size);
        return ApiResponse.success(resources.map(this::convertToDTO));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ApiResponse.success("删除成功", null);
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadResource(@PathVariable Long id) {
        Optional<Resource> resource = resourceService.getResourceById(id);
        if (resource.isPresent()) {
            Resource res = resource.get();
            try {
                byte[] fileContent = Files.readAllBytes(Paths.get(res.getFilePath()));
                resourceService.incrementDownloadCount(id);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + res.getFileName() + "\"")
                        .header(HttpHeaders.CONTENT_TYPE, res.getFileType() != null ? res.getFileType() : "application/octet-stream")
                        .body(fileContent);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("下载失败");
            }
        }
        return ResponseEntity.notFound().build();
    }

    private ResourceDTO convertToDTO(Resource resource) {
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
