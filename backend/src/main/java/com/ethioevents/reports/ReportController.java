package com.ethioevents.reports;

import com.ethioevents.common.ApiResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/events/{eventId}/analytics")
    public ResponseEntity<ApiResponse<ReportDtos.EventAnalyticsSummaryDto>> getEventAnalytics(
            @PathVariable UUID eventId) {
        ReportDtos.EventAnalyticsSummaryDto analytics = reportService.getEventAnalytics(eventId);
        return ResponseEntity.ok(ApiResponse.ok(analytics));
    }

    @GetMapping("/events/{eventId}/attendees/csv")
    public ResponseEntity<byte[]> downloadAttendeeManifestCsv(@PathVariable UUID eventId) {
        byte[] csvData = reportService.generateAttendeeManifestCsv(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"EthioEvents-Attendees-" + eventId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    @GetMapping("/events/{eventId}/financials/csv")
    public ResponseEntity<byte[]> downloadFinancialOrdersCsv(@PathVariable UUID eventId) {
        byte[] csvData = reportService.generateFinancialOrdersCsv(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"EthioEvents-Financials-" + eventId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
