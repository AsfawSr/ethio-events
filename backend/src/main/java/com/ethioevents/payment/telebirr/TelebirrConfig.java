package com.ethioevents.payment.telebirr;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "ethioevents.telebirr")
public class TelebirrConfig {

    private String appId;
    private String appSecret;
    private String shortCode;
    private String notifyUrl;
    private String returnUrl;
    private String apiUrl;
    private String merchantPrivateKeyPkcs8;
    private String telebirrPublicKey;

    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getAppSecret() { return appSecret; }
    public void setAppSecret(String appSecret) { this.appSecret = appSecret; }
    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }
    public String getNotifyUrl() { return notifyUrl; }
    public void setNotifyUrl(String notifyUrl) { this.notifyUrl = notifyUrl; }
    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }
    public String getApiUrl() { return apiUrl; }
    public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }
    public String getMerchantPrivateKeyPkcs8() { return merchantPrivateKeyPkcs8; }
    public void setMerchantPrivateKeyPkcs8(String merchantPrivateKeyPkcs8) { this.merchantPrivateKeyPkcs8 = merchantPrivateKeyPkcs8; }
    public String getTelebirrPublicKey() { return telebirrPublicKey; }
    public void setTelebirrPublicKey(String telebirrPublicKey) { this.telebirrPublicKey = telebirrPublicKey; }
}
