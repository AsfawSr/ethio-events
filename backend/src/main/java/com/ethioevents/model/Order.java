package com.ethioevents.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_number", nullable = false, unique = true, length = 32)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "ETB";

    @Column(name = "exchange_rate", precision = 10, scale = 4)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(name = "foreign_amount", precision = 12, scale = 2)
    private BigDecimal foreignAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_gateway", length = 30)
    private PaymentGateway paymentGateway = PaymentGateway.TELEBIRR;

    @Column(name = "is_gift")
    private Boolean isGift = false;

    @Column(name = "gift_recipient_name", length = 100)
    private String giftRecipientName;

    @Column(name = "gift_recipient_phone", length = 20)
    private String giftRecipientPhone;

    @Column(name = "gift_message", columnDefinition = "TEXT")
    private String giftMessage;

    @Column(name = "purchaser_email", length = 150)
    private String purchaserEmail;

    @Column(name = "purchaser_country", length = 50)
    private String purchaserCountry;

    @Column(name = "stripe_payment_intent_id", length = 100)
    private String stripePaymentIntentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "reserved_until_utc", nullable = false)
    private Instant reservedUntilUtc;

    @Column(name = "affiliate_code", length = 50)
    private String affiliateCode;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Order() {}

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public Instant getReservedUntilUtc() { return reservedUntilUtc; }
    public void setReservedUntilUtc(Instant reservedUntilUtc) { this.reservedUntilUtc = reservedUntilUtc; }
    public String getAffiliateCode() { return affiliateCode; }
    public void setAffiliateCode(String affiliateCode) { this.affiliateCode = affiliateCode; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
    public BigDecimal getForeignAmount() { return foreignAmount; }
    public void setForeignAmount(BigDecimal foreignAmount) { this.foreignAmount = foreignAmount; }
    public PaymentGateway getPaymentGateway() { return paymentGateway; }
    public void setPaymentGateway(PaymentGateway paymentGateway) { this.paymentGateway = paymentGateway; }
    public Boolean getIsGift() { return isGift; }
    public boolean isGift() { return Boolean.TRUE.equals(isGift); }
    public void setIsGift(Boolean isGift) { this.isGift = isGift; }
    public String getGiftRecipientName() { return giftRecipientName; }
    public void setGiftRecipientName(String giftRecipientName) { this.giftRecipientName = giftRecipientName; }
    public String getGiftRecipientPhone() { return giftRecipientPhone; }
    public void setGiftRecipientPhone(String giftRecipientPhone) { this.giftRecipientPhone = giftRecipientPhone; }
    public String getGiftMessage() { return giftMessage; }
    public void setGiftMessage(String giftMessage) { this.giftMessage = giftMessage; }
    public String getPurchaserEmail() { return purchaserEmail; }
    public void setPurchaserEmail(String purchaserEmail) { this.purchaserEmail = purchaserEmail; }
    public String getPurchaserCountry() { return purchaserCountry; }
    public void setPurchaserCountry(String purchaserCountry) { this.purchaserCountry = purchaserCountry; }
    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
