package com.ethioevents.order;

import com.ethioevents.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Public Guest Checkout Reservation (Zero Login Required)
     */
    @PostMapping("/guest-reserve")
    public ResponseEntity<ApiResponse<OrderDtos.ReservationResponse>> reserveGuestOrder(
            @Valid @RequestBody OrderDtos.GuestReserveRequest request) {
        OrderDtos.ReservationResponse response = orderService.reserveGuestOrder(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderDtos.OrderDetailsResponse>> getOrderDetails(
            @PathVariable String orderNumber) {
        OrderDtos.OrderDetailsResponse response = orderService.getOrderDetails(orderNumber);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<OrderDtos.OrderDetailsResponse>>> getMyTickets(
            @RequestParam String phone) {
        List<OrderDtos.OrderDetailsResponse> responses = orderService.getOrdersByCustomerPhone(phone);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }
}
