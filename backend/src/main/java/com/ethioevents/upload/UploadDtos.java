package com.ethioevents.upload;

import java.time.Instant;

public class UploadDtos {

    public record FileUploadResponse(
            String fileUrl,
            String fileName,
            long fileSize,
            String contentType,
            Instant uploadedAt
    ) {}
}
