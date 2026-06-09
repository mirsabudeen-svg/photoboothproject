package com.futad.photobooth.core.database

import android.content.Context
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.security.SecureRandom

object KeystoreHelper {
    private const val PREFS_NAME = "secure_db_prefs"
    private const val PREFS_KEY = "db_passphrase"

    fun getOrCreateDatabasePassphrase(context: Context): ByteArray {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        val prefs = EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
        val existing = prefs.getString(PREFS_KEY, null)
        if (existing != null) {
            return Base64.decode(existing, Base64.DEFAULT)
        }
        val passphrase = ByteArray(32).also { SecureRandom().nextBytes(it) }
        prefs.edit()
            .putString(PREFS_KEY, Base64.encodeToString(passphrase, Base64.DEFAULT))
            .apply()
        return passphrase
    }
}
