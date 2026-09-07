package com.ethioevents.payment.telebirr;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.TreeMap;

@Service
public class TelebirrWebhookVerifier {

    private static final Logger log = LoggerFactory.getLogger(TelebirrWebhookVerifier.class);

    private final TelebirrConfig config;
    private PublicKey telebirrPublicKey;
    private PrivateKey merchantPrivateKey;

    public TelebirrWebhookVerifier(TelebirrConfig config) {
        this.config = config;
        try {
            if (config.getTelebirrPublicKey() != null && !config.getTelebirrPublicKey().isBlank()) {
                String cleanPub = config.getTelebirrPublicKey()
                        .replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s", "");
                byte[] pubBytes = Base64.getDecoder().decode(cleanPub);
                X509EncodedKeySpec pubSpec = new X509EncodedKeySpec(pubBytes);
                this.telebirrPublicKey = KeyFactory.getInstance("RSA").generatePublic(pubSpec);
            }

            if (config.getMerchantPrivateKeyPkcs8() != null && !config.getMerchantPrivateKeyPkcs8().isBlank()) {
                String cleanPriv = config.getMerchantPrivateKeyPkcs8()
                        .replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s", "");
                byte[] privBytes = Base64.getDecoder().decode(cleanPriv);
                PKCS8EncodedKeySpec privSpec = new PKCS8EncodedKeySpec(privBytes);
                this.merchantPrivateKey = KeyFactory.getInstance("RSA").generatePrivate(privSpec);
            }
        } catch (Exception e) {
            log.warn("Telebirr RSA Keys not initialized in standard format (using mock verification fallback for dev mode): {}", e.getMessage());
        }
    }

    /**
     * Signs payload string using Merchant RSA Private Key (SHA256withRSA)
     */
    public String signPayload(String data) {
        if (merchantPrivateKey == null) {
            // Mock signature in dev mode
            return Base64.getEncoder().encodeToString(("mock_sig_" + data.hashCode()).getBytes(StandardCharsets.UTF_8));
        }
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(merchantPrivateKey);
            signature.update(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signature.sign());
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign Telebirr payload", e);
        }
    }

    /**
     * Verifies incoming Telebirr webhook signature
     */
    public boolean verifySignature(Map<String, String> payloadParams, String signatureBase64) {
        if (telebirrPublicKey == null || signatureBase64 == null) {
            log.info("Accepting Telebirr mock signature in dev environment");
            return true;
        }

        try {
            // Sort parameters alphabetically
            Map<String, String> sortedParams = new TreeMap<>(payloadParams);
            sortedParams.remove("sign");
            sortedParams.remove("sign_type");

            StringBuilder canonical = new StringBuilder();
            for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isBlank()) {
                    if (canonical.length() > 0) canonical.append("&");
                    canonical.append(entry.getKey()).append("=").append(entry.getValue());
                }
            }

            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(this.telebirrPublicKey);
            signature.update(canonical.toString().getBytes(StandardCharsets.UTF_8));
            return signature.verify(Base64.getDecoder().decode(signatureBase64));
        } catch (Exception e) {
            log.error("Telebirr RSA signature verification error", e);
            return false;
        }
    }
}
