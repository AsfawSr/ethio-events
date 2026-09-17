package com.ethioevents.order;

import com.ethioevents.auth.PhoneNormalizer;
import com.ethioevents.common.ApiException;
import com.ethioevents.localization.LocalizedDateTimeDto;
import com.ethioevents.model.*;
import com.ethioevents.repository.*;
import com.ethioevents.reservation.TicketReservationService;
import com.ethioevents.ticket.TicketService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final SecureRandom random = new SecureRandom();

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final TicketRepository ticketRepository;
    private final TransactionRepository transactionRepository;
    private final TicketReservationService ticketReservationService;
    private final TicketService ticketService;
    private final com.ethioevents.promo.PromoService promoService;
    private final com.ethioevents.affiliate.AffiliateService affiliateService;
    private final com.ethioevents.seating.SeatingService seatingService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        UserRepository userRepository,
                        TicketTypeRepository ticketTypeRepository,
                        TicketRepository ticketRepository,
                        TransactionRepository transactionRepository,
                        TicketReservationService ticketReservationService,
                        TicketService ticketService,
                        com.ethioevents.promo.PromoService promoService,
                        com.ethioevents.affiliate.AffiliateService affiliateService,
                        com.ethioevents.seating.SeatingService seatingService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.ticketRepository = ticketRepository;
        this.transactionRepository = transactionRepository;
        this.ticketReservationService = ticketReservationService;
        this.ticketService = ticketService;
        this.promoService = promoService;
        this.affiliateService = affiliateService;
        this.seatingService = seatingService;
    }

    /**
     * Frictionless Zero-Login Guest Reservation with 10-Minute Lock
     */
    @Transactional
    public OrderDtos.ReservationResponse reserveGuestOrder(OrderDtos.GuestReserveRequest request) {
        String normalizedPhone = PhoneNormalizer.normalize(request.customerPhone());

        // 1. Shadow user creation or lookup
        User user = userRepository.findByPhoneNumber(normalizedPhone).orElseGet(() -> {
            User newUser = new User();
            newUser.setPhoneNumber(normalizedPhone);
            newUser.setFullName(request.customerName().trim());
            newUser.setRole(UserRole.CUSTOMER);
            return userRepository.save(newUser);
        });

        // 2. Atomically hold capacity in ticket_types
        TicketType ticketType = ticketReservationService.holdTicketCapacity(request.ticketTypeId(), request.quantity());

        // 3. Calculate totals & lock duration
        BigDecimal rawSubtotal = ticketType.getPrice().multiply(BigDecimal.valueOf(request.quantity()));
        BigDecimal totalAmount = rawSubtotal;

        // 3b. Apply promo code discount if provided
        if (request.promoCode() != null && !request.promoCode().isBlank()) {
            com.ethioevents.promo.PromoDtos.ValidatePromoResponse promoRes =
                    promoService.validatePromoCode(new com.ethioevents.promo.PromoDtos.ValidatePromoRequest(
                            ticketType.getEvent().getId(),
                            request.promoCode(),
                            rawSubtotal,
                            request.quantity()
                    ));
            if (promoRes.valid()) {
                totalAmount = promoRes.finalTotal();
                promoService.incrementTimesUsed(request.promoCode());
                log.info("Applied promo code {} to order: Discount {} ETB, Net Total {} ETB",
                        request.promoCode(), promoRes.discountAmount(), totalAmount);
            }
        }

        Instant reservedUntil = Instant.now().plus(Duration.ofMinutes(10));
        String orderNumber = "ORD-" + System.currentTimeMillis() % 1000000 + "-" + (1000 + random.nextInt(9000));

        // 4. Create Order
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUser(user);
        order.setEvent(ticketType.getEvent());
        order.setCustomerPhone(normalizedPhone);
        order.setCustomerName(request.customerName().trim());
        order.setTotalAmount(totalAmount);
        order.setCurrency("ETB");
        order.setStatus(OrderStatus.PENDING);
        order.setReservedUntilUtc(reservedUntil);
        if (request.affiliateCode() != null && !request.affiliateCode().isBlank()) {
            order.setAffiliateCode(request.affiliateCode().trim().toLowerCase());
        }

        Order savedOrder = orderRepository.save(order);

        // 5. Create OrderItem
        OrderItem item = new OrderItem(savedOrder, ticketType, request.quantity(), ticketType.getPrice());
        if (request.selectedSeatIds() != null && !request.selectedSeatIds().isEmpty()) {
            item.setSelectedSeatIds(request.selectedSeatIds().stream().map(UUID::toString).collect(Collectors.joining(",")));
        }
        orderItemRepository.save(item);

        log.info("Created pending reservation Order {} for {}", orderNumber, normalizedPhone);

        long expiresInSeconds = Duration.between(Instant.now(), reservedUntil).getSeconds();

        return new OrderDtos.ReservationResponse(
                orderNumber,
                ticketType.getEvent().getTitle(),
                ticketType.getName(),
                request.quantity(),
                ticketType.getPrice(),
                totalAmount,
                "ETB",
                OrderStatus.PENDING.name(),
                reservedUntil.toString(),
                expiresInSeconds,
                LocalizedDateTimeDto.fromInstant(ticketType.getEvent().getStartTimeUtc())
        );
    }

    public OrderDtos.OrderDetailsResponse getOrderDetails(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());

        List<OrderDtos.OrderItemDto> itemDtos = items.stream()
                .map(i -> new OrderDtos.OrderItemDto(i.getTicketType().getName(), i.getQuantity(), i.getUnitPrice(), i.getSubtotal()))
                .collect(Collectors.toList());

        List<OrderDtos.OrderTicketDto> ticketDtos = tickets.stream()
                .map(t -> new OrderDtos.OrderTicketDto(t.getTicketCode(), t.getTicketType().getName(), t.getAttendeeName(), t.getSecurityHash(), t.getStatus().name(), t.getSeatLabel()))
                .collect(Collectors.toList());

        return new OrderDtos.OrderDetailsResponse(
                order.getOrderNumber(),
                order.getEvent().getTitle(),
                order.getEvent().getSlug(),
                order.getEvent().getVenueName(),
                order.getEvent().getVenueAddress(),
                LocalizedDateTimeDto.fromInstant(order.getEvent().getStartTimeUtc()),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getStatus().name(),
                order.getReservedUntilUtc().toString(),
                itemDtos,
                ticketDtos
        );
    }

    public List<OrderDtos.OrderDetailsResponse> getOrdersByCustomerPhone(String rawPhone) {
        String normalizedPhone = PhoneNormalizer.normalize(rawPhone);
        List<Order> orders = orderRepository.findByCustomerPhoneOrderByCreatedAtDesc(normalizedPhone);

        return orders.stream().map(order -> {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());

            List<OrderDtos.OrderItemDto> itemDtos = items.stream()
                    .map(i -> new OrderDtos.OrderItemDto(i.getTicketType().getName(), i.getQuantity(), i.getUnitPrice(), i.getSubtotal()))
                    .collect(Collectors.toList());

            List<OrderDtos.OrderTicketDto> ticketDtos = tickets.stream()
                    .map(t -> new OrderDtos.OrderTicketDto(t.getTicketCode(), t.getTicketType().getName(), t.getAttendeeName(), t.getSecurityHash(), t.getStatus().name(), t.getSeatLabel()))
                    .collect(Collectors.toList());

            return new OrderDtos.OrderDetailsResponse(
                    order.getOrderNumber(),
                    order.getEvent().getTitle(),
                    order.getEvent().getSlug(),
                    order.getEvent().getVenueName(),
                    order.getEvent().getVenueAddress(),
                    LocalizedDateTimeDto.fromInstant(order.getEvent().getStartTimeUtc()),
                    order.getCustomerName(),
                    order.getCustomerPhone(),
                    order.getTotalAmount(),
                    order.getCurrency(),
                    order.getStatus().name(),
                    order.getReservedUntilUtc().toString(),
                    itemDtos,
                    ticketDtos
            );
        }).collect(Collectors.toList());
    }

    /**
     * Transition order to PAID and issue cryptographic tickets
     */
    @Transactional
    public Order completePaymentSuccess(String orderNumber, PaymentGateway gateway, String gatewayReference, String rawPayload) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

        if (order.getStatus() == OrderStatus.PAID) {
            log.info("Order {} is already marked as PAID (Idempotent call)", orderNumber);
            return order;
        }

        order.setStatus(OrderStatus.PAID);
        Order savedOrder = orderRepository.save(order);

        // 1. Commit reserved inventory
        ticketReservationService.commitReservation(savedOrder);

        // 2. Record transaction
        Transaction tx = new Transaction();
        tx.setTransactionReference("TX-" + UUID.randomUUID().toString().substring(0, 18));
        tx.setOrder(savedOrder);
        tx.setGateway(gateway);
        tx.setGatewayReference(gatewayReference);
        tx.setAmount(savedOrder.getTotalAmount());
        tx.setCurrency(savedOrder.getCurrency());
        tx.setStatus(PaymentStatus.SUCCESS);
        tx.setRawPayload(rawPayload);
        tx.setVerifiedAt(Instant.now());
        transactionRepository.save(tx);

        // 3. Issue cryptographic tickets with Ed25519 signatures
        List<Ticket> generatedTickets = ticketService.generateTicketsForOrder(savedOrder);

        // 3b. Confirm and link assigned reserved seats if present
        List<OrderItem> items = orderItemRepository.findByOrderId(savedOrder.getId());
        for (OrderItem item : items) {
            if (item.getSelectedSeatIds() != null && !item.getSelectedSeatIds().isBlank()) {
                try {
                    List<UUID> seatIds = java.util.Arrays.stream(item.getSelectedSeatIds().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .map(UUID::fromString)
                            .collect(Collectors.toList());
                    seatingService.confirmSeatsForOrder(savedOrder, seatIds, generatedTickets);
                } catch (Exception e) {
                    log.warn("Failed to confirm seats for order {}: {}", orderNumber, e.getMessage());
                }
            }
        }

        // 4. Record promoter affiliate commission referral if attached
        if (savedOrder.getAffiliateCode() != null && !savedOrder.getAffiliateCode().isBlank()) {
            try {
                affiliateService.recordOrderReferral(savedOrder, savedOrder.getAffiliateCode());
            } catch (Exception e) {
                log.warn("Failed to record affiliate referral for order {}: {}", orderNumber, e.getMessage());
            }
        }

        log.info("Order {} marked as PAID and tickets issued successfully", orderNumber);
        return savedOrder;
    }
}
