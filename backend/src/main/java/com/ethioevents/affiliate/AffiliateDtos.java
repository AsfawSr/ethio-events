package com.ethioevents.affiliate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AffiliateDtos {

    public static class RegisterAffiliateRequest {
        @NotBlank(message = "Promoter or channel name is required")
        private String promoterName;

        @NotBlank(message = "Phone number is required")
        private String phoneNumber;

        private String email;

        @NotBlank(message = "Affiliate code is required (e.g. tikvahethiopia)")
        @Pattern(regexp = "^[a-zA-Z0-9_-]{3,30}$", message = "Code must be 3-30 alphanumeric characters")
        private String affiliateCode;

        private String bankName = "Commercial Bank of Ethiopia (CBE)";
        private String bankAccountNo;
        private String bankAccountName;

        public RegisterAffiliateRequest() {}

        public String getPromoterName() {
            return promoterName;
        }

        public void setPromoterName(String promoterName) {
            this.promoterName = promoterName;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getAffiliateCode() {
            return affiliateCode;
        }

        public void setAffiliateCode(String affiliateCode) {
            this.affiliateCode = affiliateCode;
        }

        public String getBankName() {
            return bankName;
        }

        public void setBankName(String bankName) {
            this.bankName = bankName;
        }

        public String getBankAccountNo() {
            return bankAccountNo;
        }

        public void setBankAccountNo(String bankAccountNo) {
            this.bankAccountNo = bankAccountNo;
        }

        public String getBankAccountName() {
            return bankAccountName;
        }

        public void setBankAccountName(String bankAccountName) {
            this.bankAccountName = bankAccountName;
        }
    }

    public static class CreateOrganizerAffiliateRequest {
        @NotBlank(message = "Promoter name is required")
        private String promoterName;

        @NotBlank(message = "Phone number is required")
        private String phoneNumber;

        private String email;

        @NotBlank(message = "Affiliate code is required")
        private String affiliateCode;

        private BigDecimal commissionRate = new BigDecimal("5.00");
        private String bankName = "Commercial Bank of Ethiopia (CBE)";
        private String bankAccountNo;
        private String bankAccountName;

        public CreateOrganizerAffiliateRequest() {}

        public String getPromoterName() {
            return promoterName;
        }

        public void setPromoterName(String promoterName) {
            this.promoterName = promoterName;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getAffiliateCode() {
            return affiliateCode;
        }

        public void setAffiliateCode(String affiliateCode) {
            this.affiliateCode = affiliateCode;
        }

        public BigDecimal getCommissionRate() {
            return commissionRate != null ? commissionRate : new BigDecimal("5.00");
        }

        public void setCommissionRate(BigDecimal commissionRate) {
            this.commissionRate = commissionRate;
        }

        public String getBankName() {
            return bankName;
        }

        public void setBankName(String bankName) {
            this.bankName = bankName;
        }

        public String getBankAccountNo() {
            return bankAccountNo;
        }

        public void setBankAccountNo(String bankAccountNo) {
            this.bankAccountNo = bankAccountNo;
        }

        public String getBankAccountName() {
            return bankAccountName;
        }

        public void setBankAccountName(String bankAccountName) {
            this.bankAccountName = bankAccountName;
        }
    }

    public static class AffiliateDto {
        private UUID id;
        private String affiliateCode;
        private String promoterName;
        private String phoneNumber;
        private String email;
        private String bankName;
        private String bankAccountNo;
        private String bankAccountName;
        private BigDecimal commissionRate;
        private int totalClicks;
        private int totalConversions;
        private BigDecimal totalSalesEtb;
        private BigDecimal totalCommissionEtb;
        private BigDecimal paidCommissionEtb;
        private BigDecimal unpaidCommissionEtb;
        private boolean active;
        private Instant createdAt;

        public AffiliateDto() {}

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getAffiliateCode() {
            return affiliateCode;
        }

        public void setAffiliateCode(String affiliateCode) {
            this.affiliateCode = affiliateCode;
        }

        public String getPromoterName() {
            return promoterName;
        }

        public void setPromoterName(String promoterName) {
            this.promoterName = promoterName;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getBankName() {
            return bankName;
        }

        public void setBankName(String bankName) {
            this.bankName = bankName;
        }

        public String getBankAccountNo() {
            return bankAccountNo;
        }

        public void setBankAccountNo(String bankAccountNo) {
            this.bankAccountNo = bankAccountNo;
        }

        public String getBankAccountName() {
            return bankAccountName;
        }

        public void setBankAccountName(String bankAccountName) {
            this.bankAccountName = bankAccountName;
        }

        public BigDecimal getCommissionRate() {
            return commissionRate;
        }

        public void setCommissionRate(BigDecimal commissionRate) {
            this.commissionRate = commissionRate;
        }

        public int getTotalClicks() {
            return totalClicks;
        }

        public void setTotalClicks(int totalClicks) {
            this.totalClicks = totalClicks;
        }

        public int getTotalConversions() {
            return totalConversions;
        }

        public void setTotalConversions(int totalConversions) {
            this.totalConversions = totalConversions;
        }

        public BigDecimal getTotalSalesEtb() {
            return totalSalesEtb;
        }

        public void setTotalSalesEtb(BigDecimal totalSalesEtb) {
            this.totalSalesEtb = totalSalesEtb;
        }

        public BigDecimal getTotalCommissionEtb() {
            return totalCommissionEtb;
        }

        public void setTotalCommissionEtb(BigDecimal totalCommissionEtb) {
            this.totalCommissionEtb = totalCommissionEtb;
        }

        public BigDecimal getPaidCommissionEtb() {
            return paidCommissionEtb;
        }

        public void setPaidCommissionEtb(BigDecimal paidCommissionEtb) {
            this.paidCommissionEtb = paidCommissionEtb;
        }

        public BigDecimal getUnpaidCommissionEtb() {
            return unpaidCommissionEtb;
        }

        public void setUnpaidCommissionEtb(BigDecimal unpaidCommissionEtb) {
            this.unpaidCommissionEtb = unpaidCommissionEtb;
        }

        public boolean isActive() {
            return active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }
    }

    public static class AffiliateReferralDto {
        private UUID id;
        private String orderNumber;
        private String eventTitle;
        private BigDecimal orderAmount;
        private BigDecimal commissionAmount;
        private String status;
        private Instant createdAt;

        public AffiliateReferralDto() {}

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getOrderNumber() {
            return orderNumber;
        }

        public void setOrderNumber(String orderNumber) {
            this.orderNumber = orderNumber;
        }

        public String getEventTitle() {
            return eventTitle;
        }

        public void setEventTitle(String eventTitle) {
            this.eventTitle = eventTitle;
        }

        public BigDecimal getOrderAmount() {
            return orderAmount;
        }

        public void setOrderAmount(BigDecimal orderAmount) {
            this.orderAmount = orderAmount;
        }

        public BigDecimal getCommissionAmount() {
            return commissionAmount;
        }

        public void setCommissionAmount(BigDecimal commissionAmount) {
            this.commissionAmount = commissionAmount;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }
    }

    public static class AffiliateDashboardDto {
        private AffiliateDto affiliate;
        private List<AffiliateReferralDto> recentReferrals;
        private double conversionRate;

        public AffiliateDashboardDto() {}

        public AffiliateDashboardDto(AffiliateDto affiliate, List<AffiliateReferralDto> recentReferrals, double conversionRate) {
            this.affiliate = affiliate;
            this.recentReferrals = recentReferrals;
            this.conversionRate = conversionRate;
        }

        public AffiliateDto getAffiliate() {
            return affiliate;
        }

        public void setAffiliate(AffiliateDto affiliate) {
            this.affiliate = affiliate;
        }

        public List<AffiliateReferralDto> getRecentReferrals() {
            return recentReferrals;
        }

        public void setRecentReferrals(List<AffiliateReferralDto> recentReferrals) {
            this.recentReferrals = recentReferrals;
        }

        public double getConversionRate() {
            return conversionRate;
        }

        public void setConversionRate(double conversionRate) {
            this.conversionRate = conversionRate;
        }
    }

    public static class TrackClickResponse {
        private boolean valid;
        private String affiliateCode;
        private String promoterName;
        private BigDecimal commissionRate;

        public TrackClickResponse() {}

        public TrackClickResponse(boolean valid, String affiliateCode, String promoterName, BigDecimal commissionRate) {
            this.valid = valid;
            this.affiliateCode = affiliateCode;
            this.promoterName = promoterName;
            this.commissionRate = commissionRate;
        }

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public String getAffiliateCode() {
            return affiliateCode;
        }

        public void setAffiliateCode(String affiliateCode) {
            this.affiliateCode = affiliateCode;
        }

        public String getPromoterName() {
            return promoterName;
        }

        public void setPromoterName(String promoterName) {
            this.promoterName = promoterName;
        }

        public BigDecimal getCommissionRate() {
            return commissionRate;
        }

        public void setCommissionRate(BigDecimal commissionRate) {
            this.commissionRate = commissionRate;
        }
    }
}
