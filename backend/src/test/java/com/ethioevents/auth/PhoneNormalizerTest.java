package com.ethioevents.auth;

import com.ethioevents.common.ApiException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PhoneNormalizerTest {

    @Test
    void testNormalizeEthioTelecom() {
        assertEquals("+251911223344", PhoneNormalizer.normalize("0911223344"));
        assertEquals("+251911223344", PhoneNormalizer.normalize("0911 22 33 44"));
        assertEquals("+251911223344", PhoneNormalizer.normalize("911223344"));
        assertEquals("+251911223344", PhoneNormalizer.normalize("+251911223344"));
        assertEquals("+251911223344", PhoneNormalizer.normalize("251911223344"));
    }

    @Test
    void testNormalizeSafaricom() {
        assertEquals("+251711223344", PhoneNormalizer.normalize("0711223344"));
        assertEquals("+251711223344", PhoneNormalizer.normalize("+251711223344"));
        assertEquals("+251711223344", PhoneNormalizer.normalize("711223344"));
    }

    @Test
    void testInvalidPhoneNumbers() {
        assertThrows(ApiException.class, () -> PhoneNormalizer.normalize("0811223344"));
        assertThrows(ApiException.class, () -> PhoneNormalizer.normalize("12345"));
        assertThrows(ApiException.class, () -> PhoneNormalizer.normalize(""));
        assertThrows(ApiException.class, () -> PhoneNormalizer.normalize(null));
    }

    @Test
    void testProviderName() {
        assertEquals("Ethio Telecom", PhoneNormalizer.getProviderName("+251911223344"));
        assertEquals("Safaricom Ethiopia", PhoneNormalizer.getProviderName("+251711223344"));
    }
}
