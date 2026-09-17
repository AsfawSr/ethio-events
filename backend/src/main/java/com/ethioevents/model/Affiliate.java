package com.ethioevents.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "affiliates")
public class Affiliate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id")
    private Organizer organizer;

    @Column(name = "affiliate_code", nullable = false, unique = true, length = 50)
    private String affiliateCode;

    @Column(name = "promoter_name", nullable = false, length = 100)
    private String promoterName;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "bank_name", length = 100)
    private String bankName = "Commercial Bank of Ethiopia (CBE)";

    @Column(name = "bank_account_no", length = 50)
    private String bankAccountNo;

    @Column(name = "bank_account_name", length = 100)
    private String bankAccountName;

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate = new BigDecimal("5.00"); // 5%

    @Column(name = "total_clicks", nullable = false)
    private int totalClicks = 0;

    @Column(name = "total_conversions", nullable = false)
    private int totalConversions = 0;

    @Column(name = "total_sales_etb", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSalesEtb = BigDecimal.ZERO;

    @Column(name = "total_commission_etb", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCommissionEtb = BigDecimal.ZERO;

    @Column(name = "paid_commission_etb", nullable = false, precision = 12, scale = 2)
    private BigDecimal paidCommissionEtb = BigDecimal.ZERO;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Affiliate() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Organizer getOrganizer() {
        return organizer;
    }

    public void setOrganizer(Organizer organizer) {
        this.organizer = organizer;
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
        return totalCommissionEtb.subtract(paidCommissionEtb);
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
