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

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        UserRepository userRepository,
                        TicketTypeRepository ticketTypeRepository,
                        TicketRepository ticketRepository,
                        TransactionRepository transactionRepository,
                        TicketReservationService ticketReservationService,
                        TicketService ticketService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.ticketRepository = ticketRepository;
        this.transactionRepository = transactionRepository;
        this.ticketReservationService = ticketReservationService;
        this.ticketService = ticketService;
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
        BigDecimal totalAmount = ticketType.getPrice().multiply(BigDecimal.valueOf(request.quantity()));
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

        Order savedOrder = orderRepository.save(order);

        // 5. Create OrderItem
        OrderItem item = new OrderItem(savedOrder, ticketType, request.quantity(), ticketType.getPrice());
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
                .map(t -> new OrderDtos.OrderTicketDto(t.getTicketCode(), t.getTicketType().getName(), t.getAttendeeName(), t.getSecurityHash(), t.getStatus().name()))
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
                    .map(t -> new OrderDtos.OrderTicketDto(t.getTicketCode(), t.getTicketType().getName(), t.getAttendeeName(), t.getSecurityHash(), t.getStatus().name()))
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
        ticketService.generateTicketsForOrder(savedOrder);

        log.info("Order {} marked as PAID and tickets issued successfully", orderNumber);
        return savedOrder;
    }
}
