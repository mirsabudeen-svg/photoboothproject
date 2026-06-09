package com.futad.photobooth.core.data.store

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import at.favre.lib.crypto.bcrypt.BCrypt
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PinManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val prefs by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "admin_pin_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun isPinSet(): Boolean = prefs.contains(PIN_HASH_KEY)

    fun setPin(rawPin: String) {
        require(rawPin.length in 4..8) { "PIN must be 4-8 digits" }
        require(rawPin.all { it.isDigit() }) { "PIN must be numeric" }
        val hash = BCrypt.withDefaults().hashToString(12, rawPin.toCharArray())
        prefs.edit().putString(PIN_HASH_KEY, hash).apply()
    }

    fun verifyPin(rawPin: String): Boolean {
        val stored = prefs.getString(PIN_HASH_KEY, null) ?: return false
        return BCrypt.verifyer().verify(rawPin.toCharArray(), stored).verified
    }

    companion object {
        private const val PIN_HASH_KEY = "pin_hash"
    }
}
