package com.campusforum.service.impl;

import com.campusforum.entity.Resource;
import com.campusforum.repository.ResourceRepository;
import com.campusforum.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {
    private final ResourceRepository resourceRepository;

    @Value("${file.upload.max-size:20971520}")
    private long maxFileSize; // 默认 20MB

    @Value("${file.upload.path:/var/lib/campusforum/uploads}")
    private String uploadPath;

    @Override
    public Resource uploadFile(Long postId, Long userId, MultipartFile file) throws IOException {
        if (!isFileSizeValid(file.getSize())) {
            throw new IOException("文件大小超过限制（最大 20MB）");
        }

        String fileName = file.getOriginalFilename();
        String storedFileName = UUID.randomUUID() + "_" + fileName;
        String filePath = uploadPath + File.separator + storedFileName;

        // 确保上传目录存在
        Files.createDirectories(Paths.get(uploadPath));

        // 保存文件
        Files.write(Paths.get(filePath), file.getBytes());

        Resource resource = Resource.builder()
                .postId(postId)
                .userId(userId)
                .fileName(fileName)
                .storedFileName(storedFileName)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .filePath(filePath)
                .downloadCount(0)
                .build();

        return resourceRepository.save(resource);
    }

    @Override
    public Optional<Resource> getResourceById(Long id) {
        return resourceRepository.findById(id);
    }

    @Override
    public Page<Resource> getResourcesByPostId(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return resourceRepository.findByPostId(postId, pageable);
    }

    @Override
    public List<Resource> getResourcesByPostIdList(Long postId) {
        return resourceRepository.findByPostId(postId);
    }

    @Override
    public Page<Resource> getResourcesByUserId(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return resourceRepository.findByUserId(userId, pageable);
    }

    @Override
    public Resource updateResource(Long id, Resource resource) {
        Optional<Resource> existing = resourceRepository.findById(id);
        if (existing.isPresent()) {
            Resource existingResource = existing.get();
            if (resource.getFileName() != null) {
                existingResource.setFileName(resource.getFileName());
            }
            return resourceRepository.save(existingResource);
        }
        return null;
    }

    @Override
    public void deleteResource(Long id) {
        Optional<Resource> resource = resourceRepository.findById(id);
        if (resource.isPresent()) {
            deleteResourceFile(resource.get());
            resourceRepository.deleteById(id);
        }
    }

    @Override
    public void incrementDownloadCount(Long resourceId) {
        Optional<Resource> resource = resourceRepository.findById(resourceId);
        if (resource.isPresent()) {
            Resource r = resource.get();
            r.setDownloadCount(r.getDownloadCount() + 1);
            resourceRepository.save(r);
        }
    }

    @Override
    public boolean isFileSizeValid(long fileSize) {
        return fileSize > 0 && fileSize <= maxFileSize;
    }

    @Override
    public void deleteResourceFile(Resource resource) {
        try {
            Files.deleteIfExists(Paths.get(resource.getFilePath()));
        } catch (IOException e) {
            // 日志记录文件删除错误
            e.printStackTrace();
        }
    }
}
