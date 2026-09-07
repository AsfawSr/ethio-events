package com.ethioevents.crypto;

import org.bouncycastle.crypto.generators.Ed25519KeyPairGenerator;
import org.bouncycastle.crypto.params.Ed25519KeyGenerationParameters;
import org.bouncycastle.crypto.params.Ed25519PrivateKeyParameters;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.bouncycastle.util.encoders.Hex;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
public class Ed25519TicketSigner {

    private static final Logger log = LoggerFactory.getLogger(Ed25519TicketSigner.class);

    private final Ed25519PrivateKeyParameters privateKey;
    private final Ed25519PublicKeyParameters publicKey;
    private final String publicKeyHex;

    public Ed25519TicketSigner(@Value("${ethioevents.crypto.ed25519-seed:VGVzdEVkaW8yMDI2RXZlbnRzU2VlZEZvclNpZ25pbmdLZXk=}") String seedBase64) {
        byte[] seedBytes;
        try {
            seedBytes = Base64.getDecoder().decode(seedBase64);
            if (seedBytes.length != 32) {
                byte[] padded = new byte[32];
                System.arraycopy(seedBytes, 0, padded, 0, Math.min(seedBytes.length, 32));
                seedBytes = padded;
            }
        } catch (Exception e) {
            log.warn("Invalid seedBase64, using fallback generated key pair");
            SecureRandom random = new SecureRandom();
            seedBytes = new byte[32];
            random.nextBytes(seedBytes);
        }

        this.privateKey = new Ed25519PrivateKeyParameters(seedBytes, 0);
        this.publicKey = this.privateKey.generatePublicKey();
        this.publicKeyHex = Hex.toHexString(this.publicKey.getEncoded());
        log.info("Ed25519 Ticket Signer initialized. Master Public Key: {}", this.publicKeyHex);
    }

    public String getPublicKeyHex() {
        return publicKeyHex;
    }

    /**
     * Creates a signed QR payload format: v1.<ticketId>.<eventId>.<nonce>.<timestamp>.<signatureHex>
     */
    public record SignedTicketPayload(
            String fullQrPayload,
            String signatureHex,
            String securityHash
    ) {}

    public SignedTicketPayload signTicket(UUID ticketId, UUID eventId, String ticketCode) {
        String nonce = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        long timestamp = System.currentTimeMillis() / 1000L;
        String rawMessage = String.format("%s.%s.%s.%d", ticketId, eventId, nonce, timestamp);

        byte[] messageBytes = rawMessage.getBytes(StandardCharsets.UTF_8);
        Ed25519Signer signer = new Ed25519Signer();
        signer.init(true, privateKey);
        signer.update(messageBytes, 0, messageBytes.length);
        byte[] signatureBytes = signer.generateSignature();
        String signatureHex = Hex.toHexString(signatureBytes);

        String fullQrPayload = String.format("v1.%s.%s.%s.%d.%s", ticketId, eventId, nonce, timestamp, signatureHex);
        String securityHash;
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest((ticketCode + ":" + nonce + ":" + signatureHex).getBytes(StandardCharsets.UTF_8));
            securityHash = Hex.toHexString(digest);
        } catch (Exception e) {
            securityHash = Hex.toHexString((ticketCode + ":" + nonce).getBytes(StandardCharsets.UTF_8));
        }

        return new SignedTicketPayload(fullQrPayload, signatureHex, securityHash);
    }

    /**
     * Verifies an Ed25519 signature in less than 1 millisecond.
     */
    public boolean verifyQrPayload(String qrPayload) {
        try {
            String[] parts = qrPayload.split("\\.");
            if (parts.length != 6 || !"v1".equals(parts[0])) {
                return false;
            }

            String rawMessage = String.format("%s.%s.%s.%s", parts[1], parts[2], parts[3], parts[4]);
            byte[] messageBytes = rawMessage.getBytes(StandardCharsets.UTF_8);
            byte[] signatureBytes = Hex.decode(parts[5]);

            Ed25519Signer verifier = new Ed25519Signer();
            verifier.init(false, publicKey);
            verifier.update(messageBytes, 0, messageBytes.length);
            return verifier.verifySignature(signatureBytes);
        } catch (Exception e) {
            return false;
        }
    }
}
