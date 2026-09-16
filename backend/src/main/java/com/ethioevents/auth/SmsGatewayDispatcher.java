package com.ethioevents.auth;

import com.ethioevents.model.SmsLog;
import com.ethioevents.repository.SmsLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Primary
@Service
public class SmsGatewayDispatcher implements SmsGatewayService {

    private static final Logger log = LoggerFactory.getLogger(SmsGatewayDispatcher.class);

    private final SmsLogRepository smsLogRepository;
    private final EthioTelecomSmsGateway ethioTelecomGateway;
    private final AfricasTalkingSmsGateway africasTalkingGateway;
    private final TwilioSmsGateway twilioGateway;
    private final String activeProvider;

    public SmsGatewayDispatcher(
            SmsLogRepository smsLogRepository,
            EthioTelecomSmsGateway ethioTelecomGateway,
            AfricasTalkingSmsGateway africasTalkingGateway,
            TwilioSmsGateway twilioGateway,
            @Value("${ethioevents.sms.provider:MOCK}") String activeProvider) {
        this.smsLogRepository = smsLogRepository;
        this.ethioTelecomGateway = ethioTelecomGateway;
        this.africasTalkingGateway = africasTalkingGateway;
        this.twilioGateway = twilioGateway;
        this.activeProvider = activeProvider.toUpperCase();
        log.info("Initialized EthioEvents SMS Notification Dispatcher with active provider: [{}]", this.activeProvider);
    }

    @Override
    public void sendOtpSms(String phoneNumber, String otpCode) {
        String message = String.format(
                "Your EthioEvents code is: %s. የEthioEvents ማረጋገጫ ኮድ: %s። Valid for 5 minutes. Do not share.",
                otpCode, otpCode
        );
        dispatch(phoneNumber, "OTP", message);
    }

    @Override
    public void sendTicketConfirmationSms(String phoneNumber, String eventTitle, String ticketCode, String ticketPassUrl) {
        String message = String.format(
                "EthioEvents Pass for %s! Ticket: %s. View your digital QR pass at: %s. የቲኬት ማለፊያዎን በዚህ ሊንክ ይመልከቱ።",
                eventTitle, ticketCode, ticketPassUrl
        );
        dispatch(phoneNumber, "TICKET_CONFIRMATION", message);
    }

    @Override
    public void sendEventUpdateSms(String phoneNumber, String eventTitle, String message) {
        String fullMessage = String.format("EthioEvents Alert [%s]: %s", eventTitle, message);
        dispatch(phoneNumber, "EVENT_UPDATE", fullMessage);
    }

    public SmsLog dispatch(String phoneNumber, String messageType, String content) {
        String provider = this.activeProvider;
        boolean success = false;
        String externalMessageId = null;
        String errorMessage = null;

        log.info("Dispatching [{}] SMS to {} via provider [{}]", messageType, phoneNumber, provider);

        switch (provider) {
            case "ETHIO_TELECOM": {
                EthioTelecomSmsGateway.SendResult res = ethioTelecomGateway.sendMessage(phoneNumber, content);
                success = res.success();
                externalMessageId = res.messageId();
                errorMessage = res.error();
                break;
            }
            case "AFRICASTALKING": {
                AfricasTalkingSmsGateway.SendResult res = africasTalkingGateway.sendMessage(phoneNumber, content);
                success = res.success();
                externalMessageId = res.messageId();
                errorMessage = res.error();
                break;
            }
            case "TWILIO": {
                TwilioSmsGateway.SendResult res = twilioGateway.sendMessage(phoneNumber, content);
                success = res.success();
                externalMessageId = res.messageId();
                errorMessage = res.error();
                break;
            }
            case "MOCK":
            default: {
                log.info("═══════════════════════════════════════════════════════════");
                log.info(" [MOCK SMS DISPATCH] Recipient: {}", phoneNumber);
                log.info(" Type: {}", messageType);
                log.info(" Message: {}", content);
                log.info("═══════════════════════════════════════════════════════════");
                success = true;
                externalMessageId = "MOCK-" + System.currentTimeMillis();
                break;
            }
        }

        // Record in Database Log
        SmsLog logEntry = new SmsLog();
        logEntry.setPhoneNumber(phoneNumber);
        logEntry.setMessageType(messageType);
        logEntry.setProvider(provider);
        logEntry.setStatus(success ? "SENT" : "FAILED");
        logEntry.setContent(content);
        logEntry.setExternalMessageId(externalMessageId);
        logEntry.setErrorMessage(errorMessage);

        try {
            return smsLogRepository.save(logEntry);
        } catch (Exception e) {
            log.warn("Failed to persist SMS log: " + e.getMessage());
            return logEntry;
        }
    }
}
