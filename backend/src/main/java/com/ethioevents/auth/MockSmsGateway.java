package com.ethioevents.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MockSmsGateway implements SmsGatewayService {

    private static final Logger log = LoggerFactory.getLogger(MockSmsGateway.class);

    @Override
    public void sendOtpSms(String phoneNumber, String otpCode) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info(" [SMS GATEWAY] Sent to {}: Your EthioEvents OTP code is: {}", phoneNumber, otpCode);
        log.info("═══════════════════════════════════════════════════════════");
    }

    @Override
    public void sendTicketConfirmationSms(String phoneNumber, String eventTitle, String ticketCode, String ticketPassUrl) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info(" [SMS TICKET CONFIRMATION] Sent to {}", phoneNumber);
        log.info(" Event: {}", eventTitle);
        log.info(" Ticket Code: {}", ticketCode);
        log.info(" Direct Ticket Pass Link: {}", ticketPassUrl);
        log.info("═══════════════════════════════════════════════════════════");
    }
}
