package com.futad.photobooth.core.data

import android.util.Base64
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.security.SecureRandom
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class LocalMediaTokenizerTest {
    private val key = ByteArray(32).also { SecureRandom().nextBytes(it) }

    @Test
    fun validTokenVerifies() {
        val token = LocalMediaTokenizer.sign("cap_001", key)
        assertTrue(LocalMediaTokenizer.verify("cap_001", token, key))
    }

    @Test
    fun expiredTokenRejected() {
        val expires = System.currentTimeMillis() - 1
        val payload = "cap_001:$expires"
        val mac = Mac.getInstance("HmacSHA256").apply { init(SecretKeySpec(key, "HmacSHA256")) }
        val sig = Base64.encodeToString(mac.doFinal(payload.toByteArray()), Base64.URL_SAFE or Base64.NO_WRAP)
        assertFalse(LocalMediaTokenizer.verify("cap_001", "$payload:$sig", key))
    }

    @Test
    fun wrongCaptureIdRejected() {
        val token = LocalMediaTokenizer.sign("cap_001", key)
        assertFalse(LocalMediaTokenizer.verify("cap_999", token, key))
    }

    @Test
    fun tamperedSignatureRejected() {
        val token = LocalMediaTokenizer.sign("cap_001", key) + "X"
        assertFalse(LocalMediaTokenizer.verify("cap_001", token, key))
    }

    @Test
    fun wrongKeyRejected() {
        val otherKey = ByteArray(32).also { SecureRandom().nextBytes(it) }
        val token = LocalMediaTokenizer.sign("cap_001", key)
        assertFalse(LocalMediaTokenizer.verify("cap_001", token, otherKey))
    }
}
