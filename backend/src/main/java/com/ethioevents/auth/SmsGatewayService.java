package com.ethioevents.auth;

public interface SmsGatewayService {
    void sendOtpSms(String phoneNumber, String otpCode);
    void sendTicketConfirmationSms(String phoneNumber, String eventTitle, String ticketCode, String ticketPassUrl);
}
