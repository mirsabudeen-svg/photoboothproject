package com.futad.photobooth.core.data

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object LocalMediaTokenizer {
    private const val TTL_MS = 15 * 60 * 1000L

    private fun masterKey(context: Context): MasterKey =
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

    fun getOrCreateSigningKey(context: Context): ByteArray {
        val prefs = EncryptedSharedPreferences.create(
            context,
            "qr_signing_prefs",
            masterKey(context),
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
        return prefs.getString("hmac_key", null)?.let { Base64.decode(it, Base64.DEFAULT) }
            ?: ByteArray(32).also { SecureRandom().nextBytes(it) }.also { key ->
                prefs.edit().putString("hmac_key", Base64.encodeToString(key, Base64.DEFAULT)).apply()
            }
    }

    fun sign(captureId: String, signingKey: ByteArray): String {
        val expires = System.currentTimeMillis() + TTL_MS
        val payload = "$captureId:$expires"
        val mac = Mac.getInstance("HmacSHA256").apply { init(SecretKeySpec(signingKey, "HmacSHA256")) }
        val sig = Base64.encodeToString(mac.doFinal(payload.toByteArray()), Base64.URL_SAFE or Base64.NO_WRAP)
        return "$payload:$sig"
    }

    fun verify(captureId: String, tokenParam: String, signingKey: ByteArray): Boolean {
        return try {
            val parts = tokenParam.split(":")
            if (parts.size != 3) return false
            val id = parts[0]
            val expiresStr = parts[1]
            val sig = parts[2]
            if (id != captureId) return false
            if (expiresStr.toLong() < System.currentTimeMillis()) return false
            val expectedPayload = "$id:$expiresStr"
            val mac = Mac.getInstance("HmacSHA256").apply { init(SecretKeySpec(signingKey, "HmacSHA256")) }
            val expectedSig = Base64.encodeToString(
                mac.doFinal(expectedPayload.toByteArray()),
                Base64.URL_SAFE or Base64.NO_WRAP,
            )
            MessageDigest.isEqual(sig.toByteArray(), expectedSig.toByteArray())
        } catch (_: Exception) {
            false
        }
    }

    fun buildUrl(host: String, port: Int, captureId: String, signingKey: ByteArray): String {
        val token = sign(captureId, signingKey)
        return "http://$host:$port/media/$captureId?token=${Uri.encode(token)}"
    }
}
