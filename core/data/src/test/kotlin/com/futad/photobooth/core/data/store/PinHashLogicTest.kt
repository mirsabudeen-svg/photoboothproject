package com.futad.photobooth.core.data.store

import at.favre.lib.crypto.bcrypt.BCrypt
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Tests PIN hashing logic (same algorithm as PinManager) without EncryptedSharedPreferences.
 */
class PinHashLogicTest {
    @Test
    fun bcryptHashIsNotRawPin() {
        val hash = BCrypt.withDefaults().hashToString(12, "5678".toCharArray())
        assertNotEquals("5678", hash)
        assertTrue(hash.startsWith("$2"))
    }

    @Test
    fun verifyCorrectPin() {
        val hash = BCrypt.withDefaults().hashToString(12, "9012".toCharArray())
        assertTrue(BCrypt.verifyer().verify("9012".toCharArray(), hash).verified)
    }

    @Test
    fun verifyWrongPin() {
        val hash = BCrypt.withDefaults().hashToString(12, "9012".toCharArray())
        assertFalse(BCrypt.verifyer().verify("0000".toCharArray(), hash).verified)
    }
}
