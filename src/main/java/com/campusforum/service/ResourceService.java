package com.campusforum.service;

import com.campusforum.entity.Resource;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface ResourceService {
    Resource uploadFile(Long postId, Long userId, MultipartFile file) throws IOException;
    Optional<Resource> getResourceById(Long id);
    Page<Resource> getResourcesByPostId(Long postId, int page, int size);
    List<Resource> getResourcesByPostIdList(Long postId);
    Page<Resource> getResourcesByUserId(Long userId, int page, int size);
    Resource updateResource(Long id, Resource resource);
    void deleteResource(Long id);
    void incrementDownloadCount(Long resourceId);
    boolean isFileSizeValid(long fileSize);
    void deleteResourceFile(Resource resource);
}
