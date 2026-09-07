package com.ethioevents.payment.telebirr;

import com.ethioevents.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class TelebirrService {

    private static final Logger log = LoggerFactory.getLogger(TelebirrService.class);

    private final TelebirrConfig config;
    private final TelebirrWebhookVerifier verifier;

    public TelebirrService(TelebirrConfig config, TelebirrWebhookVerifier verifier) {
        this.config = config;
        this.verifier = verifier;
    }

    public record TelebirrCheckoutResponse(
            String toPayUrl,
            String outTradeNo,
            String transactionRef,
            boolean isMockSimulator
    ) {}

    public TelebirrCheckoutResponse initiateCheckout(Order order) {
        String outTradeNo = order.getOrderNumber();
        String nonce = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        long timestamp = System.currentTimeMillis() / 1000L;

        Map<String, String> payload = new HashMap<>();
        payload.put("appId", config.getAppId());
        payload.put("outTradeNo", outTradeNo);
        payload.put("subject", "EthioEvents: " + order.getEvent().getTitle());
        payload.put("totalAmount", order.getTotalAmount().toPlainString());
        payload.put("shortCode", config.getShortCode());
        payload.put("notifyUrl", config.getNotifyUrl());
        payload.put("returnUrl", config.getReturnUrl().replace("{orderNumber}", outTradeNo));
        payload.put("timeoutExpress", "10m");
        payload.put("nonce", nonce);
        payload.put("timestamp", String.valueOf(timestamp));

        String rawToSign = String.format("appId=%s&nonce=%s&outTradeNo=%s&subject=%s&timestamp=%d&totalAmount=%s",
                config.getAppId(), nonce, outTradeNo, payload.get("subject"), timestamp, payload.get("totalAmount"));
        String signature = verifier.signPayload(rawToSign);
        payload.put("sign", signature);
        payload.put("sign_type", "SHA256withRSA");

        log.info("Built Telebirr H5 Checkout Payload for Order {}. Signature: {}", outTradeNo, signature);

        // Web Checkout URL (Telebirr H5 direct or mock simulator URL)
        String toPayUrl = String.format("http://localhost:3000/mock-payment/telebirr?order=%s&amount=%s",
                outTradeNo, order.getTotalAmount().toPlainString());

        return new TelebirrCheckoutResponse(toPayUrl, outTradeNo, "TEL-" + outTradeNo, true);
    }
}
