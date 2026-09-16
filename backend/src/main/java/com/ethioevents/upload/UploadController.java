package com.ethioevents.upload;

import com.ethioevents.common.ApiException;
import com.ethioevents.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {

    private static final Logger log = LoggerFactory.getLogger(UploadController.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"
    );

    private final Path uploadDirectory;

    public UploadController(@Value("${ethioevents.upload.dir:./uploads}") String uploadDir) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Path eventImagesDir = this.uploadDirectory.resolve("events");
            if (!Files.exists(eventImagesDir)) {
                Files.createDirectories(eventImagesDir);
            }
            log.info("Media Upload Directory initialized at: {}", eventImagesDir);
        } catch (IOException e) {
            log.error("Failed to create upload directories: " + e.getMessage(), e);
        }
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UploadDtos.FileUploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "Please select an image file to upload");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Image exceeds maximum allowed size of 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "INVALID_FORMAT",
                    "Invalid image format. Supported formats: JPEG, PNG, WebP, GIF, SVG");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        } else {
            extension = ".jpg";
        }

        String safeFileName = "evt-" + UUID.randomUUID().toString().substring(0, 18) + extension;
        Path targetPath = this.uploadDirectory.resolve("events").resolve(safeFileName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Successfully uploaded image: {} (Size: {} bytes)", safeFileName, file.getSize());

            // Build relative or full URL
            String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
            String fileUrl = baseUrl + "/uploads/events/" + safeFileName;

            UploadDtos.FileUploadResponse response = new UploadDtos.FileUploadResponse(
                    fileUrl,
                    originalFilename,
                    file.getSize(),
                    contentType,
                    Instant.now()
            );

            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (IOException e) {
            log.error("Failed to save uploaded file: " + e.getMessage(), e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "UPLOAD_FAILED", "Failed to save image to server storage");
        }
    }
}
