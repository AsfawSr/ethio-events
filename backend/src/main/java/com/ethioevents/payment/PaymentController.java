package com.ethioevents.payment;

import com.ethioevents.common.ApiException;
import com.ethioevents.common.ApiResponse;
import com.ethioevents.model.Order;
import com.ethioevents.model.OrderStatus;
import com.ethioevents.model.PaymentGateway;
import com.ethioevents.order.OrderService;
import com.ethioevents.payment.chapa.ChapaService;
import com.ethioevents.payment.telebirr.TelebirrService;
import com.ethioevents.payment.telebirr.TelebirrWebhookVerifier;
import com.ethioevents.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final TelebirrService telebirrService;
    private final TelebirrWebhookVerifier telebirrWebhookVerifier;
    private final ChapaService chapaService;

    public PaymentController(OrderRepository orderRepository,
                             OrderService orderService,
                             TelebirrService telebirrService,
                             TelebirrWebhookVerifier telebirrWebhookVerifier,
                             ChapaService chapaService) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.telebirrService = telebirrService;
        this.telebirrWebhookVerifier = telebirrWebhookVerifier;
        this.chapaService = chapaService;
    }

    public record PaymentInitiateRequest(String orderNumber) {}

    public record SimulatePaymentRequest(
            String orderNumber,
            PaymentGateway gateway
    ) {}

    @PostMapping("/telebirr/initiate")
    public ResponseEntity<ApiResponse<TelebirrService.TelebirrCheckoutResponse>> initiateTelebirr(
            @RequestBody PaymentInitiateRequest request) {
        Order order = orderRepository.findByOrderNumber(request.orderNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ORDER_STATUS", "Order is already " + order.getStatus());
        }

        TelebirrService.TelebirrCheckoutResponse response = telebirrService.initiateCheckout(order);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/telebirr/notify")
    public ResponseEntity<Map<String, Object>> telebirrWebhook(
            @RequestParam Map<String, String> allParams,
            @RequestBody(required = false) String rawBody) {
        log.info("Received Telebirr Webhook Notification: params={}", allParams);

        String sign = allParams.get("sign");
        String outTradeNo = allParams.get("outTradeNo");

        boolean isValid = telebirrWebhookVerifier.verifySignature(allParams, sign);
        if (!isValid) {
            log.warn("Telebirr Webhook Signature Verification FAILED for Order {}", outTradeNo);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("code", 1, "msg", "Invalid signature"));
        }

        orderService.completePaymentSuccess(outTradeNo, PaymentGateway.TELEBIRR, allParams.get("tradeNo"), rawBody);
        return ResponseEntity.ok(Map.of("code", 0, "msg", "success"));
    }

    @PostMapping("/chapa/initiate")
    public ResponseEntity<ApiResponse<ChapaService.ChapaCheckoutResponse>> initiateChapa(
            @RequestBody PaymentInitiateRequest request) {
        Order order = orderRepository.findByOrderNumber(request.orderNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ORDER_STATUS", "Order is already " + order.getStatus());
        }

        ChapaService.ChapaCheckoutResponse response = chapaService.initiateCheckout(order);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/simulate-success")
    public ResponseEntity<ApiResponse<String>> simulatePaymentSuccess(
            @RequestBody SimulatePaymentRequest request) {
        PaymentGateway gateway = request.gateway() != null ? request.gateway() : PaymentGateway.TELEBIRR;
        orderService.completePaymentSuccess(request.orderNumber(), gateway, "SIM-" + System.currentTimeMillis(), "{\"simulated\":true}");
        return ResponseEntity.ok(ApiResponse.ok("Payment simulated successfully. Order is now PAID and tickets have been issued."));
    }
}
