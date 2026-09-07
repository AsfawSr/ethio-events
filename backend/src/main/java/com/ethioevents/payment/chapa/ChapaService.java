package com.ethioevents.payment.chapa;

import com.ethioevents.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ChapaService {

    private static final Logger log = LoggerFactory.getLogger(ChapaService.class);

    @Value("${ethioevents.chapa.secret-key:CHASECK_TEST-demo}")
    private String secretKey;

    @Value("${ethioevents.chapa.base-url:https://api.chapa.co/v1}")
    private String baseUrl;

    public record ChapaCheckoutResponse(
            String checkoutUrl,
            String txRef,
            boolean isMockSimulator
    ) {}

    public ChapaCheckoutResponse initiateCheckout(Order order) {
        String txRef = "CHP-" + order.getOrderNumber();
        log.info("Initiating Chapa Checkout for Order {} with tx_ref: {}", order.getOrderNumber(), txRef);

        String checkoutUrl = String.format("http://localhost:3000/mock-payment/chapa?order=%s&amount=%s&txRef=%s",
                order.getOrderNumber(), order.getTotalAmount().toPlainString(), txRef);

        return new ChapaCheckoutResponse(checkoutUrl, txRef, true);
    }
}
