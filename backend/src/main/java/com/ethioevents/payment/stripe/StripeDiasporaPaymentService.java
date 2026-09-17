package com.ethioevents.payment.stripe;

import com.ethioevents.common.ApiException;
import com.ethioevents.model.Order;
import com.ethioevents.model.OrderStatus;
import com.ethioevents.model.PaymentGateway;
import com.ethioevents.order.OrderService;
import com.ethioevents.payment.currency.CurrencyExchangeService;
import com.ethioevents.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class StripeDiasporaPaymentService {

    private static final Logger log = LoggerFactory.getLogger(StripeDiasporaPaymentService.class);

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final CurrencyExchangeService currencyExchangeService;
    private final String publishableKey;
    private final String secretKey;

    public record StripeCheckoutResponse(
            String orderNumber,
            String clientSecret,
            String checkoutUrl,
            String paymentIntentId,
            BigDecimal amount,
            String currency,
            BigDecimal exchangeRateEtb,
            boolean isGift,
            String giftRecipientName
    ) {}

    public StripeDiasporaPaymentService(
            OrderRepository orderRepository,
            OrderService orderService,
            CurrencyExchangeService currencyExchangeService,
            @Value("${ethioevents.stripe.publishable-key:pk_test_demo_diaspora_key}") String publishableKey,
            @Value("${ethioevents.stripe.secret-key:sk_test_demo_diaspora_key}") String secretKey) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.currencyExchangeService = currencyExchangeService;
        this.publishableKey = publishableKey;
        this.secretKey = secretKey;
    }

    @Transactional
    public StripeCheckoutResponse initiateStripeCheckout(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found: " + orderNumber));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ORDER_STATUS", "Order is already " + order.getStatus());
        }

        String targetCurrency = order.getCurrency() != null && !order.getCurrency().isBlank() ? order.getCurrency().toUpperCase() : "USD";
        if ("ETB".equalsIgnoreCase(targetCurrency)) {
            targetCurrency = "USD"; // Default international currency for card processing
        }

        BigDecimal rate = currencyExchangeService.getExchangeRate(targetCurrency);
        BigDecimal foreignAmount = currencyExchangeService.convertEtbToForeign(order.getTotalAmount(), targetCurrency);

        order.setCurrency(targetCurrency);
        order.setExchangeRate(rate);
        order.setForeignAmount(foreignAmount);
        order.setPaymentGateway(PaymentGateway.STRIPE_DIASPORA);

        String paymentIntentId = "pi_diaspora_" + System.currentTimeMillis() + "_" + order.getOrderNumber().toLowerCase();
        String clientSecret = paymentIntentId + "_secret_demo";
        order.setStripePaymentIntentId(paymentIntentId);
        orderRepository.save(order);

        String checkoutUrl = "http://localhost:3000/mock-payment/stripe?orderNumber=" + orderNumber + "&pi=" + paymentIntentId;

        log.info("Initialized Stripe Diaspora checkout for order {} ({} {} = {} ETB). Gifting: {}",
                orderNumber, foreignAmount, targetCurrency, order.getTotalAmount(), order.isGift());

        return new StripeCheckoutResponse(
                orderNumber,
                clientSecret,
                checkoutUrl,
                paymentIntentId,
                foreignAmount,
                targetCurrency,
                rate,
                order.isGift(),
                order.getGiftRecipientName()
        );
    }

    @Transactional
    public void confirmStripePayment(String orderNumber, String paymentIntentId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found: " + orderNumber));

        if (order.getStatus() == OrderStatus.PAID) {
            log.info("Order {} is already marked as PAID.", orderNumber);
            return;
        }

        log.info("Confirming Stripe diaspora payment for order {}. Gateway: STRIPE_DIASPORA, Ref: {}",
                orderNumber, paymentIntentId);

        orderService.completeOrder(orderNumber, PaymentGateway.STRIPE_DIASPORA, paymentIntentId);
    }
}
